// see https://github.com/mu-semtech/mu-javascript-template for more info
import { app, errorHandler, uuid, sparqlEscapeDateTime } from 'mu';
import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';
import fs from 'fs-extra';
import bodyParser from 'body-parser';

const PERIOD = process.env.PERIOD || 10;

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

