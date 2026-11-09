import React from 'react';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {PageTabAccess,Tabs,TabsList,TabsTrigger,TabsContent} from '../src/components/ui/tabs';

test('denied tab and content are absent and an allowed tab becomes selected',()=>{
 const html=renderToStaticMarkup(<PageTabAccess.Provider value={{blocked:false,allowed:true}}><Tabs defaultValue="blocked"><TabsList><TabsTrigger value="blocked">Forbidden label</TabsTrigger><TabsTrigger value="allowed">Allowed label</TabsTrigger></TabsList><TabsContent forceMount value="blocked">Forbidden content</TabsContent><TabsContent forceMount value="allowed">Allowed content</TabsContent></Tabs></PageTabAccess.Provider>);
 assert.ok(!html.includes('Forbidden'));assert.ok(html.includes('Allowed content'));assert.match(html,/data-state="active"[^>]*>Allowed label/);
});
test('nested tabs do not inherit unrelated outer tab names',()=>{
 const html=renderToStaticMarkup(<PageTabAccess.Provider value={{settlement:false,settings:true}}><Tabs defaultValue="settings"><TabsContent forceMount value="settings"><Tabs defaultValue="settlement"><TabsList><TabsTrigger value="settlement">Settlement rules</TabsTrigger></TabsList><TabsContent forceMount value="settlement">Nested settings</TabsContent></Tabs></TabsContent></Tabs></PageTabAccess.Provider>);
 assert.ok(html.includes('Settlement rules'));assert.ok(html.includes('Nested settings'));
});
