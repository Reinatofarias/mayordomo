import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appOrigin, originFromHeaders} from '../src/config/app-url.ts';

function headers(values: Record<string,string>) {
 return new Headers(values);
}

test('app origin prefers production request host over localhost APP_URL',()=>{
 const incoming=headers({'x-forwarded-host':'mayordomoai.vercel.app','x-forwarded-proto':'https'});
 assert.equal(appOrigin(incoming,'http://localhost:3000'),'https://mayordomoai.vercel.app');
});

test('app origin accepts configured production URL',()=>{
 const incoming=headers({'host':'preview.vercel.app','x-forwarded-proto':'https'});
 assert.equal(appOrigin(incoming,'https://mayordomoai.vercel.app/'),'https://mayordomoai.vercel.app');
});

test('origin from headers falls back to host and local protocol',()=>{
 assert.equal(originFromHeaders(headers({'host':'localhost:3000'})),'http://localhost:3000');
 assert.equal(originFromHeaders(headers({'host':'mayordomoai.vercel.app'})),'https://mayordomoai.vercel.app');
});
