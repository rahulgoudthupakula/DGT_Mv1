import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vendorPhoneLimit,limitVendorPhone} from './vendorPhone.ts';
test('US typing and paste cannot exceed ten digits',()=>{
 assert.equal(vendorPhoneLimit('US'),10);
 assert.equal(limitVendorPhone('US','202555012345'), '2025550123');
 assert.equal(limitVendorPhone('US','202abc5550123'), '2025550123');
});
test('country changes apply the destination limit',()=>{
 assert.equal(limitVendorPhone('US','123456789012'), '1234567890');
 assert.equal(vendorPhoneLimit('CA'),10);
});
test('country metadata allows domestic prefixes and significant zeros',()=>{
 assert.equal(vendorPhoneLimit('GB','02079460018'),11);
 assert.equal(limitVendorPhone('GB','02079460018999'),'02079460018');
 assert.equal(vendorPhoneLimit('IT','0236618300'),12);
});
