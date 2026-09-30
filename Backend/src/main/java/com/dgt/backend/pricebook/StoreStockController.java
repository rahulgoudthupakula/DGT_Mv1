package com.dgt.backend.pricebook;
import java.util.*;
import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import org.springframework.web.bind.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/current-stock")
public class StoreStockController {
 private final ScopedAccess a;
 public StoreStockController(ScopedAccess a){this.a=a;}
 @GetMapping public Object list(@PathVariable String store){a.grant(a.user(),store,"PRICE_BOOK",false);
 var items=a.db.queryForList("SELECT p.purchase_gross_cost,p.purchase_discount,p.purchase_unit,p.units_per_case,p.product_id AS id,p.product_name AS \"itemName\",p.product_sku AS sku,d.store_department_name AS department,s.store_sub_department_name AS category,i.available_quantity AS \"onHandQty\",COALESCE((SELECT json_agg(json_build_object('id',v.vendor_id,'name',v.vendor_name) ORDER BY v.vendor_name,v.vendor_id) FROM product_vendors l JOIN vendors v ON v.vendor_id=l.vendor_id AND v.dgt_id=l.dgt_id WHERE l.archived_at IS NULL AND l.product_id=p.product_id AND l.dgt_id=p.dgt_id),'[]'::json) AS vendors FROM products p JOIN store_sub_departments s ON s.store_sub_department_id=p.store_sub_department_id AND s.dgt_id=p.dgt_id JOIN store_departments d ON d.store_department_id=s.store_department_id AND d.dgt_id=p.dgt_id LEFT JOIN inventory i ON i.product_id=p.product_id AND i.dgt_id=p.dgt_id WHERE p.dgt_id=? ORDER BY p.product_name,p.product_id",store);
 var info=a.db.queryForMap("SELECT store_name AS name,timezone FROM stores WHERE dgt_id=?",store);
 return Map.of("items",items.stream().map(this::value).map(Rows::normalize).toList(),"store",Rows.normalize(info));
 }
 private Map<String,Object> value(Map<String,Object> row){
 var gross=(java.math.BigDecimal)row.remove("purchase_gross_cost");var discount=(java.math.BigDecimal)row.remove("purchase_discount");var unit=row.remove("purchase_unit");var pack=(Integer)row.remove("units_per_case");
 java.math.BigDecimal cost=null;
 if(gross!=null&&discount!=null&&(!"CASE".equals(unit)||(pack!=null&&pack>0))){var divisor="CASE".equals(unit)?java.math.BigDecimal.valueOf(pack):java.math.BigDecimal.ONE;cost=gross.divide(divisor,6,java.math.RoundingMode.HALF_UP).subtract(discount.divide(divisor,6,java.math.RoundingMode.HALF_UP));}
 var qty=(java.math.BigDecimal)row.get("onHandQty");row.put("currentUnitCost",cost);row.put("inventoryValue",qty==null||cost==null?null:qty.multiply(cost).setScale(2,java.math.RoundingMode.HALF_UP));return row;
 }
 @GetMapping("/{id}/movements") public Object movements(@PathVariable String store,@PathVariable long id){a.grant(a.user(),store,"PRICE_BOOK",false);
 if(a.db.queryForList("SELECT product_id FROM products WHERE product_id=? AND dgt_id=?",id,store).isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Item not found in this store");
 var rows=a.db.queryForList("SELECT movement_id AS id,created_at AS date,movement_type AS type,qty_changed AS qty,reference_id AS reference FROM inventory_movements WHERE dgt_id=? AND product_id=? ORDER BY created_at DESC,movement_id DESC LIMIT 100",store,id);
 return Map.of("movements",rows.stream().map(Rows::normalize).toList());
 }
}
