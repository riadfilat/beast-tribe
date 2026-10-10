// The HQ staff session form (admin/src/lib/events.ts): times, Men only / Women only, community.
import test from 'node:test';
import assert from 'node:assert/strict';
import { eventToForm, readSessionForm, toIso, toLocalInput } from '../admin/src/lib/events.ts';

const SPORTS = [{ id: 'sport-padel', name: 'Padel', slug: 'padel' }];
const OPEN = '5a1aad83-a62a-4d2f-aa95-10535368072f';
const CLUB = 'b4fb2a29-3e33-461f-b1cb-ad4fd9277e2f';

const form = (fields) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ title: 'Friday padel', sport: 'padel', starts_at: '2026-10-16T18:30', country: 'SA', gender: 'all', ...fields })) fd.set(k, v);
  return fd;
};

test('times are the country’s local time', () => {
  assert.equal(toIso('2026-10-16T18:30', 'SA'), '2026-10-16T15:30:00.000Z');
  assert.equal(toIso('2026-10-16T18:30', 'AE'), '2026-10-16T14:30:00.000Z');
  assert.equal(toLocalInput('2026-10-16T15:30:00.000Z', 'SA'), '2026-10-16T18:30');
  assert.equal(toIso('tomorrow', 'SA'), null);
});

test('a good form gives the columns, sport id and slug together', () => {
  const r = readSessionForm(form({ max_capacity: '12' }), SPORTS, OPEN);
  assert.ok('values' in r);
  assert.equal(r.values.event_type, 'padel');
  assert.equal(r.values.sport_id, 'sport-padel');
  assert.equal(r.values.max_capacity, 12);
  assert.equal(r.values.starts_at, '2026-10-16T15:30:00.000Z');
});

test('women only and men only are never both on', () => {
  for (const [g, w, m] of [['women', true, false], ['men', false, true], ['all', false, false]]) {
    const r = readSessionForm(form({ gender: g }), SPORTS, OPEN);
    assert.equal(r.values.is_women_only, w, g);
    assert.equal(r.values.is_men_only, m, g);
  }
});

test('community: empty means the open Beast Tribe community; not sent means unchanged', () => {
  assert.equal(readSessionForm(form({ community: '' }), SPORTS, OPEN).values.community_id, OPEN);
  const club = readSessionForm(form({ community: CLUB }), SPORTS, OPEN).values;
  assert.equal(club.community_id, CLUB);
  assert.equal(club.visibility, 'community');
  assert.equal('community_id' in readSessionForm(form({}), SPORTS, OPEN).values, false);
});

test('plain errors for missing or wrong fields', () => {
  assert.equal(readSessionForm(form({ title: ' ' }), SPORTS, OPEN).error, 'Give the session a name.');
  assert.equal(readSessionForm(form({ sport: 'chess' }), SPORTS, OPEN).error, 'Pick a sport.');
  assert.equal(readSessionForm(form({ starts_at: '' }), SPORTS, OPEN).error, 'Pick the day and time it starts.');
  assert.match(readSessionForm(form({ ends_at: '2026-10-16T17:00' }), SPORTS, OPEN).error, /after the start/);
  assert.match(readSessionForm(form({ max_capacity: '0' }), SPORTS, OPEN).error, /between 1 and 5,000/);
});

test('an existing session fills the same form back', () => {
  const v = eventToForm({ title: 'X', event_type: 'gym_class', sport_id: 'sport-padel', starts_at: '2026-10-16T15:30:00Z', country: 'SA', is_men_only: true, community_id: CLUB }, SPORTS);
  assert.equal(v.sport, 'padel');
  assert.equal(v.starts_at, '2026-10-16T18:30');
  assert.equal(v.gender, 'men');
  assert.equal(v.community, CLUB);
});
