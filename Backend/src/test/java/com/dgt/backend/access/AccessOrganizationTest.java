package com.dgt.backend.access;

import com.dgt.backend.access.controller.AccessController;
import com.dgt.backend.access.controller.ApprovalController;
import com.dgt.backend.access.controller.ChildStoreController;
import com.dgt.backend.access.controller.EmployeePermissionController;
import com.dgt.backend.access.controller.ProfileController;
import com.dgt.backend.access.controller.ProfileSessionController;
import com.dgt.backend.access.controller.RoleAccessController;
import com.dgt.backend.access.controller.SignupRequestController;
import com.dgt.backend.access.dto.ChangePasswordRequest;
import com.dgt.backend.access.dto.CreateAccessUserRequest;
import com.dgt.backend.access.dto.CreateChildStoreRequest;
import com.dgt.backend.access.dto.RolePermissionBatch;
import com.dgt.backend.access.repository.PagePermissionsRepository;
import com.dgt.backend.access.repository.ProfileRepository;
import com.dgt.backend.access.repository.RefreshTokenRepository;
import com.dgt.backend.access.security.JwtService;
import com.dgt.backend.access.security.PagePermissionInterceptor;
import com.dgt.backend.access.security.PagePermissions;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.access.service.AccessService;
import com.dgt.backend.access.service.ApprovalService;
import com.dgt.backend.access.service.ChildStoreService;
import com.dgt.backend.access.service.ProfileService;
import com.dgt.backend.access.service.RefreshTokenService;
import com.dgt.backend.access.service.RoleAccessService;
import com.dgt.backend.portal.PortalBridge;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.core.env.MapPropertySource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Regression checks for package moves and HTTP/service separation; no database connection needed. */
class AccessOrganizationTest {
    @Test void allAccessComponentsStillWireTogether() {
        try (var context = new AnnotationConfigApplicationContext()) {
            context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("test", Map.of(
                    "app.profile.enabled", "true", "app.jwt.secret", "access-refactor-test-key-32-characters-long")));
            context.registerBean(JdbcTemplate.class, () -> mock(JdbcTemplate.class));
            context.registerBean(PasswordEncoder.class, () -> mock(PasswordEncoder.class));
            context.registerBean(ObjectMapper.class, () -> new ObjectMapper());
            context.registerBean(PortalBridge.class, () -> mock(PortalBridge.class));
            context.scan("com.dgt.backend.access");
            context.refresh();
            for (Class<?> type : List.of(AccessController.class, ProfileController.class,
                    ChildStoreController.class, EmployeePermissionController.class, RoleAccessController.class,
                    ApprovalController.class, ProfileSessionController.class, SignupRequestController.class,
                    ScopedAccess.class, PagePermissionInterceptor.class, JwtService.class, ApprovalService.class)) {
                assertNotNull(context.getBean(type));
            }
        }
    }

    @Test void httpRoutesRemainUnchanged() {
        Set<String> routes = new TreeSet<>();
        for (Class<?> type : List.of(AccessController.class, ProfileController.class,
                ChildStoreController.class, EmployeePermissionController.class, RoleAccessController.class,
                ApprovalController.class, ProfileSessionController.class, SignupRequestController.class)) {
            var base = AnnotatedElementUtils.findMergedAnnotation(type, RequestMapping.class);
            String prefix = base == null ? "" : base.value()[0];
            for (var method : type.getDeclaredMethods()) {
                var mapping = AnnotatedElementUtils.findMergedAnnotation(method, RequestMapping.class);
                if (mapping != null) routes.add(mapping.method()[0] + " " + prefix +
                        (mapping.value().length == 0 ? "" : mapping.value()[0]));
            }
        }
        assertEquals(Set.of(
                "GET /api/v1/access/me", "GET /api/v1/access/stores", "GET /api/v1/access/stores/{store}/context",
                "GET /api/v1/access/stores/{store}/permissions", "PUT /api/v1/access/stores/{store}/permissions",
                "PUT /api/v1/access/stores/{store}/approval-policy", "PUT /api/v1/access/stores/{store}/roles",
                "POST /api/v1/access/stores/{store}/users", "GET /api/v1/access/profile",
                "PATCH /api/v1/access/profile", "PUT /api/v1/access/profile/password",
                "GET /api/v1/access/stores/{store}/manage-stores", "POST /api/v1/access/stores/{store}/manage-stores",
                "GET /api/v1/access/stores/{store}/employee-access/{id}/permissions",
                "PUT /api/v1/access/stores/{store}/employee-access/{id}/permissions",
                "GET /api/v1/access/stores/{store}/role-permissions", "PUT /api/v1/access/stores/{store}/role-permissions",
                "PUT /api/v1/access/stores/{store}/role-permissions/batch", "GET /api/v1/access/stores/{store}/approvals",
                "POST /api/v1/access/stores/{store}/approvals/{id}/decision", "POST /api/v1/access/session",
                "POST /api/v1/access/session/refresh", "POST /api/v1/access/session/logout",
                "GET /api/v1/access/profile/history", "POST /api/v1/signup-requests",
                "POST /api/v1/client-handling/activate"), routes);
    }

    @Test void profileVersionConflictStillPreventsPasswordWrite() {
        var access = mock(ScopedAccess.class);
        var repository = mock(ProfileRepository.class);
        var encoder = mock(PasswordEncoder.class);
        when(access.user()).thenReturn(7L);
        when(repository.lockAccount(7L)).thenReturn(Map.of("version", "2"));
        var controller = new ProfileController(new ProfileService(access, encoder, repository));
        var error = assertThrows(ResponseStatusException.class, () -> controller.password("1",
                new ChangePasswordRequest("old", "long-new-password", "long-new-password")));
        assertEquals(409, error.getStatusCode().value());
        assertEquals("Profile changed; reload before saving", error.getReason());
        verifyNoInteractions(encoder);
        verify(repository, never()).updatePassword(any(), any());
    }

    @Test void passwordChangeKeepsVerificationHashingAndResponse() {
        var access = mock(ScopedAccess.class);
        var repository = mock(ProfileRepository.class);
        var encoder = mock(PasswordEncoder.class);
        when(access.user()).thenReturn(7L);
        when(repository.lockAccount(7L)).thenReturn(Map.of("version", "2", "user_id", 7L, "password_hash", "old-hash"));
        when(encoder.matches("current-secret", "old-hash")).thenReturn(true);
        when(encoder.encode("long-new-password")).thenReturn("new-hash");
        var controller = new ProfileController(new ProfileService(access, encoder, repository));
        assertEquals(Map.of("signInAgain", true), controller.password("2",
                new ChangePasswordRequest("current-secret", "long-new-password", "long-new-password")));
        verify(repository).updatePassword("new-hash", 7L);
    }

    @Test void transactionBoundariesNowBelongToServices() throws Exception {
        assertNotNull(ProfileService.class.getMethod("password", String.class, ChangePasswordRequest.class).getAnnotation(Transactional.class));
        assertNotNull(RoleAccessService.class.getMethod("saveBatch", String.class, RolePermissionBatch.class).getAnnotation(Transactional.class));
        assertNotNull(ChildStoreService.class.getMethod("create", String.class, UUID.class, CreateChildStoreRequest.class).getAnnotation(Transactional.class));
        assertNotNull(AccessService.class.getMethod("createUser", String.class, CreateAccessUserRequest.class).getAnnotation(Transactional.class));
    }
    @Test void employeeOverrideStillBlocksParentAndNestedPages() {
        var access = mock(ScopedAccess.class);
        var repository = mock(PagePermissionsRepository.class);
        when(repository.findRoleRights(7L, "DGT-1017")).thenReturn(List.of(
                Map.of("role_type_id", 1L, "permission_code", "MODULE_GROCERY", "allowed", true)));
        when(repository.findOverrides("DGT-1017", 7L)).thenReturn(List.of(
                Map.of("key", "GROCERY_PAGE_INVENTORY", "allowed", false),
                Map.of("key", "GROCERY_PAGE_INVENTORY_ADJUSTMENT", "allowed", true)));
        var pages = new PagePermissions(access, repository);
        assertTrue(pages.evaluate("DGT-1017", 7L, false, false).get("GROCERY_PAGE_INVENTORY"));
        var effective = pages.evaluate("DGT-1017", 7L, false, true);
        assertFalse(effective.get("GROCERY_PAGE_INVENTORY"));
        assertFalse(effective.get("GROCERY_PAGE_INVENTORY_ADJUSTMENT"));
    }

    @Test void refreshRotationRejectsConsumedTokenWithoutIssuingAnother() {
        var repository = mock(RefreshTokenRepository.class);
        when(repository.consumeToken(any())).thenReturn(List.of());
        var tokens = new RefreshTokenService(3600L, repository);
        var error = assertThrows(ResponseStatusException.class, () -> tokens.rotate("used-token"));
        assertEquals(401, error.getStatusCode().value());
        verify(repository, never()).insertToken(any(), any(), any());
    }
}
