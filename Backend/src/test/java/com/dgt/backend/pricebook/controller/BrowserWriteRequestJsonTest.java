package com.dgt.backend.pricebook.controller;

import com.dgt.backend.access.security.PagePermissions;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.access.service.ApprovalService;
import com.dgt.backend.common.config.RecordRequestJsonConfig;
import com.dgt.backend.departments.controller.StoreDepartmentAccessController;
import com.dgt.backend.pricebook.service.BulkItemLinks;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value={StorePromotionController.class,PriceBookController.class},
    excludeAutoConfiguration={SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class})
@TestPropertySource(properties={"app.pricebook.enabled=true", "spring.jackson.property-naming-strategy=SNAKE_CASE"})
@Import(RecordRequestJsonConfig.class)
class BrowserWriteRequestJsonTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockitoBean ScopedAccess access;
    @MockitoBean ApprovalService approvals;
    @MockitoBean PagePermissions pages;
    @MockitoBean BulkItemLinks bulkLinks;

    @Test void browserCamelCasePromotionReachesApprovalWithAllValues() throws Exception {
        when(approvals.submit(anyString(),anyString(),isNull(),isNull(),any(),anyString()))
            .thenReturn(Map.of("saved",true));
        mvc.perform(post("/api/v1/access/stores/STORE/promotions")
            .header("Idempotency-Key",UUID.randomUUID().toString()).contentType("application/json")
            .content("""
                {"name":"Offer","type":"Buy X Get Y","products":[{"productId":42,"quantity":1}],
                 "discountValue":null,"buyQty":2,"freeQty":1,"start":"2030-01-01","end":"2030-01-31"}
                """))
            .andExpect(status().isOk());
        var input=org.mockito.ArgumentCaptor.forClass(StorePromotionController.Input.class);
        verify(approvals).submit(eq("STORE"),eq("PROMOTION_SAVE"),isNull(),isNull(),input.capture(),anyString());
        assertThat(input.getValue().products().getFirst().productId()).isEqualTo(42);
        assertThat(input.getValue().buyQty()).isEqualByComparingTo("2");
        assertThat(input.getValue().freeQty()).isEqualByComparingTo("1");
    }

    @Test void snakeCaseRemainsCompatibleAndSerializationIsUnchanged() {
        var input=json.readValue("""
            {"name":"Offer","products":[{"product_id":42,"quantity":1}],"discount_value":3.5}
            """, StorePromotionController.Input.class);
        assertThat(input.products().getFirst().productId()).isEqualTo(42);
        assertThat(input.discountValue()).isEqualByComparingTo("3.5");
        assertThat(json.writeValueAsString(input)).contains("\"product_id\":42", "\"discount_value\":3.5");
    }

    @Test void malformedOrNullPrimitiveProductReturns400WithoutSubmitting() throws Exception {
        for (String body : new String[]{"{", "{\"products\":[{\"productId\":null,\"quantity\":1}]}"}) {
            mvc.perform(post("/api/v1/access/stores/STORE/promotions")
                .header("Idempotency-Key",UUID.randomUUID().toString()).contentType("application/json").content(body))
                .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(approvals);
    }

    @Test void otherBrowserRecordInputsAcceptCamelCaseWithoutLosingOptionalFields() {
        var item=json.readValue("{\"subDept\":\"Bakery\",\"ebtSnap\":true,\"unitsPerCase\":12,\"currentInventory\":3}",PriceBookController.Input.class);
        assertThat(item.subDept()).isEqualTo("Bakery");
        assertThat(item.ebtSnap()).isTrue();
        assertThat(item.unitsPerCase()).isEqualTo(12);
        assertThat(item.currentInventory()).isEqualByComparingTo("3");
        var department=json.readValue("{\"name\":\"Grocery\",\"subDepartments\":[{\"name\":\"Bakery\"}]}",StoreDepartmentAccessController.Create.class);
        assertThat(department.subDepartments()).hasSize(1);
    }

    @Test void browserItemCreatePreservesRequiredCostAndDepartment() throws Exception {
        when(approvals.submit(anyString(),anyString(),isNull(),isNull(),any(),anyString()))
            .thenReturn(Map.of("saved",true));
        mvc.perform(post("/api/v1/access/stores/STORE/items")
            .header("Idempotency-Key",UUID.randomUUID().toString()).contentType("application/json")
            .content("""
                {"name":"Bread","dept":"Grocery","subDept":"Bakery","purchaseGrossCost":2.5,
                 "purchaseDiscount":0,"unitType":"item","retail":4,"ebtSnap":true,"allowReturns":false}
                """))
            .andExpect(status().isOk());
        var input=org.mockito.ArgumentCaptor.forClass(PriceBookController.Input.class);
        verify(approvals).submit(eq("STORE"),eq("ITEM_CREATE"),isNull(),isNull(),input.capture(),anyString());
        assertThat(input.getValue().purchaseGrossCost()).isEqualByComparingTo("2.5");
        assertThat(input.getValue().subDept()).isEqualTo("Bakery");
        assertThat(input.getValue().allowReturns()).isFalse();
    }

    @Test void browserBulkUpdatePreservesNestedCostsAndAllLinkIds() throws Exception {
        when(approvals.submit(anyString(),anyString(),isNull(),isNull(),any(),anyString()))
            .thenReturn(Map.of("saved",true));
        mvc.perform(post("/api/v1/access/stores/STORE/items/bulk")
            .header("Idempotency-Key",UUID.randomUUID().toString()).contentType("application/json")
            .content("""
                {"rows":[{"id":42,"version":"123","item":{"name":"Bread","subDept":"Bakery",
                "purchaseGrossCost":2.5,"purchaseDiscount":0,"currentInventory":12,"inventoryVersion":"456"},
                "links":{"version":"snapshot","groupId":7,"groupVersion":"789","vendorIds":[8],
                "promotionIds":[9],"promotionVersions":{"9":"101"}}}]}
                """))
            .andExpect(status().isOk());
        var input=org.mockito.ArgumentCaptor.forClass(PriceBookController.BulkInput.class);
        verify(approvals).submit(eq("STORE"),eq("ITEM_BULK_UPDATE"),isNull(),isNull(),input.capture(),anyString());
        var row=input.getValue().rows().getFirst();
        assertThat(row.item().purchaseGrossCost()).isEqualByComparingTo("2.5");
        assertThat(row.item().currentInventory()).isEqualByComparingTo("12");
        assertThat(row.item().inventoryVersion()).isEqualTo("456");
        assertThat(row.links().vendorIds()).containsExactly(8L);
        assertThat(row.links().groupId()).isEqualTo(7L);
        assertThat(row.links().groupVersion()).isEqualTo("789");
        assertThat(row.links().promotionIds()).containsExactly(9L);
        assertThat(row.links().promotionVersions()).containsEntry(9L,"101");
    }

    @Test void accessWorkforceFuelAndClosingRecordsPreserveBrowserFieldNames() {
        var profile=json.readValue("{\"firstName\":\"Pat\",\"lastName\":\"Lee\",\"currentPassword\":\"example-only\"}",
            com.dgt.backend.access.dto.UpdateProfileRequest.class);
        assertThat(profile.firstName()).isEqualTo("Pat");
        assertThat(profile.currentPassword()).isEqualTo("example-only");
        var role=json.readValue("{\"userId\":42,\"roleTypeId\":7,\"active\":true,\"version\":\"123\"}",
            com.dgt.backend.access.dto.RoleAssignmentRequest.class);
        assertThat(role.userId()).isEqualTo(42);
        assertThat(role.roleTypeId()).isEqualTo(7);
        var shift=json.readValue("{\"employeeId\":42,\"jobTitle\":\"Cashier\",\"overrideReason\":\"Approved coverage\"}",
            com.dgt.backend.workforce.WorkforceService.ShiftInput.class);
        assertThat(shift.employeeId()).isEqualTo(42);
        assertThat(shift.overrideReason()).isEqualTo("Approved coverage");
        var fuel=json.readValue("{\"gradeId\":\"regular\",\"effectiveTime\":\"NOW\",\"overlapChoice\":\"REPLACE\"}",
            com.dgt.backend.fuel.price.StoreGasPriceController.Input.class);
        assertThat(fuel.gradeId()).isEqualTo("regular");
        assertThat(fuel.effectiveTime()).isEqualTo("NOW");
        var closing=json.readValue("{\"sourceToken\":\"snapshot\",\"openingCash\":100,\"cashAdded\":20,\"cashDrops\":10,\"close\":false}",
            com.dgt.backend.dailyclosing.scoped.StoreClosingController.Save.class);
        assertThat(closing.sourceToken()).isEqualTo("snapshot");
        assertThat(closing.openingCash()).isEqualByComparingTo("100");
        assertThat(closing.cashAdded()).isEqualByComparingTo("20");
    }
}
