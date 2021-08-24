// see https://github.com/mu-semtech/mu-javascript-template for more info
import { app, errorHandler, uuid, sparqlEscapeDateTime } from 'mu';
import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';
const http = require('http');

const PERIOD = process.env.PERIOD || 10;

let index = Date.now();

if(process.env.DIRECT_DELTAS) {
  setInterval(() => {
    let deltas = []
    for(let i = 0; i < 10; i++) {
      deltas.push({
        index: index,
        inserts: [{subject:   { type: "uri", value: `http://mu.semte.ch/services/github/madnificent/book-service/books/${index}`},
                   predicate: { type: "uri", value: "http://mu.semte.ch/vocabularies/core/uuid"},
                   object:    { type: "literal", value: `${index}` }},
                  {subject:   { type: "uri", value: `http://mu.semte.ch/services/github/madnificent/book-service/books/${index}`},
                   predicate: { type: "uri", value: "http://schema.org/headline"},
                   object:    { type: "literal", value: `${index}`}}],
        deletes: []
      });
      deltas.push({
        index: index+1,
        deletes: [{subject:   { type: "uri", value: `http://mu.semte.ch/services/github/madnificent/book-service/books/${index}`},
                   predicate: { type: "uri", value: "http://mu.semte.ch/vocabularies/core/uuid"},
                   object:    { type: "literal", value: `${index}` }},
                  {subject:   { type: "uri", value: `http://mu.semte.ch/services/github/madnificent/book-service/books/${index}`},
                   predicate: { type: "uri", value: "http://schema.org/headline"},
                   object:    { type: "literal", value: `${index}`}}],
        inserts: []
      });
      index++;
    }
    shuffle(deltas);
    for(const delta of deltas) {
      let data = JSON.stringify([delta]);
      let req = http.request("http://producer/delta", {method: "POST", headers: {'Content-Type': "application/json"}});
      req.write(data);
      console.log(data);
      req.end();
    }
    console.log("Delta sent");
  }, PERIOD);
} else {
  setInterval(async () => {
    let id = uuid();
    let time = new Date().getTime();
    let waitfor = [update(`
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    PREFIX schema: <http://schema.org/>

    INSERT DATA {
      GRAPH <http://mu.semte.ch/graphs/public> {
        <http://mu.semte.ch/services/github/madnificent/book-service/books/${id}/> a schema:Book ;
          mu:uuid "${id}" ;
          schema:headline "${time}" .
      }
    }`),
                   new Promise(resolve => setTimeout(resolve, PERIOD * 9 / 10))]
    await Promise.all(waitfor) // Wait until the update has happened and at least nine tenths of the period has passed

    update(`
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    PREFIX schema: <http://schema.org/>

    DELETE DATA {
      GRAPH <http://mu.semte.ch/graphs/public> {
        <http://mu.semte.ch/services/github/madnificent/book-service/books/${id}/> a schema:Book ;
          mu:uuid "${id}" ;
          schema:headline "${time}" .
      }
    }`);
  }, PERIOD);
}

function shuffle(arr) {
  for(let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i+1));
    let tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}
