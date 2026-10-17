// Every place shows a picture: its own photo, else the art of the sport being hosted, else of one of its sports.
import test from 'node:test';
import assert from 'node:assert/strict';
import { placePicture, sportPicture } from '../src/lib/sportPhotos.ts';

test('a place with its own photo keeps it', () => {
  assert.equal(placePicture('https://x/own.jpg', ['padel'], 'padel'), 'https://x/own.jpg');
});

test("without its own photo, it shows the hosted sport's art", () => {
  assert.equal(placePicture(null, ['padel', 'tennis'], 'tennis'), sportPicture('tennis'));
});

test('a sport the place does not take, or no sport chosen: the first of its sports with art', () => {
  assert.equal(placePicture(null, ['yoga', 'running'], 'football'), sportPicture('yoga'));
  assert.equal(placePicture(null, ['climbing']), sportPicture('climbing'));
});

test('art is brand art served by the site, never another venue\'s photo', () => {
  assert.match(sportPicture('padel'), /\/places\/art\/padel\.jpg$/);
  assert.doesNotMatch(placePicture(null, ['padel']), /andorra/);
});

test('no art anywhere: nothing (the app shows the sport icon)', () => {
  assert.equal(placePicture(null, ['dance', 'golf']), null);
});
