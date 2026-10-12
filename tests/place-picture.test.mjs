// Every place shows a picture: its own, else the photo of the sport being hosted, else of one of its sports.
import test from 'node:test';
import assert from 'node:assert/strict';
import { placePicture, sportPicture } from '../src/lib/sportPhotos.ts';

test('a place with its own photo keeps it', () => {
  assert.equal(placePicture('https://x/own.jpg', ['padel'], 'padel'), 'https://x/own.jpg');
});

test("without its own photo, it shows the hosted sport's photo", () => {
  assert.equal(placePicture(null, ['padel', 'tennis'], 'tennis'), sportPicture('tennis'));
});

test('a sport the place does not take, or no sport chosen: the first of its sports with a photo', () => {
  assert.equal(placePicture(null, ['yoga', 'running'], 'football'), sportPicture('running'));
  assert.equal(placePicture(null, ['climbing']), sportPicture('climbing'));
});

test('no photo anywhere: nothing (the app shows the sport icon)', () => {
  assert.equal(placePicture(null, ['meditation']), null);
});
