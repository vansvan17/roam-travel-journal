import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { transformSync } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Exercise the real JSX components in Node without a browser or a second UI implementation.
registerHooks({
  load(url, context, nextLoad) {
    if (!url.endsWith('.jsx')) return nextLoad(url, context);
    return { format: 'module', shortCircuit: true, source: transformSync(readFileSync(new URL(url), 'utf8'), { loader: 'jsx', jsx: 'automatic', format: 'esm' }).code };
  }
});
const { TripDetail } = await import('../client/src/components/TripDetail.jsx');
const { Journal, Budgets } = await import('../client/src/components/collections.jsx');
const { ItemForm, TripForm, AuthForm } = await import('../client/src/components/forms.jsx');
const { Landing } = await import('../client/src/components/Landing.jsx');
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
const noop = () => {};
const trip = { id:'test-trip', title:'Goa weekend', destination:'Goa', country:'India', startDate:'2026-11-01', endDate:'2026-11-01', status:'Upcoming', planStatus:'Draft', budget:3000, currency:'INR', cover:'coast', notes:'', itinerary:[], expenses:[], entries:[] };

test('empty itinerary renders the map icon and readiness state without using the global Map constructor', () => {
  const html=render(TripDetail,{trip,busy:false,onSave:noop,onCalendar:noop,onBack:noop,onEdit:noop,onDelete:noop,onAdd:noop,onRemove:noop});
  assert.match(html,/Leave a little room for adventure/);
  assert.match(html,/0 of 1 days planned/);
  assert.match(html,/Mark plan ready/);
});
test('empty journal and budget screens render their real empty states', () => {
  assert.match(render(Journal,{trips:[],onOpen:noop,onNew:noop}),/Make a little memory/);
  assert.match(render(Budgets,{trips:[],onOpen:noop}),/Your adventure fund starts with a trip/);
});
test('all form variants and the landing page render after component extraction', () => {
  assert.match(render(Landing,{onDemo:noop,onAuth:noop}),/Explore the demo/);
  assert.match(render(TripForm,{busy:false,onSave:noop,onCancel:noop}),/Where are we going/);
  assert.match(render(AuthForm,{type:'register',onSwitch:noop,onSuccess:noop,onDemo:noop}),/Create my account/);
  for(const type of ['stop','expense','entry']) assert.ok(render(ItemForm,{type,trip,busy:false,onSave:noop}).includes('<form'));
});
test('a fully planned trip renders its ready state and calendar action', () => {
  const planned={...trip,planStatus:'Ready',itinerary:[{id:crypto.randomUUID(),day:1,time:'09:00',durationMinutes:60,title:'Breakfast',notes:''}]};
  const html=render(TripDetail,{trip:planned,busy:false,onSave:noop,onCalendar:noop,onBack:noop,onEdit:noop,onDelete:noop,onAdd:noop,onRemove:noop});
  assert.match(html,/1 of 1 days planned/);assert.match(html,/Move back to draft/);assert.match(html,/Export itinerary calendar/);
});
