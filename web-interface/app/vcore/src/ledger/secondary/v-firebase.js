const VFirebase = ( function() { // eslint-disable-line no-unused-vars

  /**
   * V Core Module to connect to Firebase (Middleware)
   *
   */

  'use strict';

  /* ================== private methods ================= */

  function setEntityNamespace( data ) {

    const a = data.uuidE;
    const b = data.contextE;
    const c = data.typeE;
    const d = data.issuer;
    const e = data.auth;

    const u = data.title;
    const v = data.tag;
    // const w = data.specialTag;

    const m = {
      a: data.uuidE,
      // b: [data.uuidE], // owners
      m: data.uuidP
    };

    const x = {
      a: [data.evmCredentials.address]
    };
    const y = {
      a: String( data.unix ),
      // b: String( data.unix ), // modified
      m: data.statusCode,
      n: data.active,
      z: String( data.expires ),
    };
    // const z = {
    //   a: [
    //     {
    //       a: String( data.unix ),
    //       b: ['Title', 'Tag'],
    //       c: [data.title, data.tag]
    //     }
    //   ]
    // };

    const variables = {
      input: {
        // Full set: a, b, c, d, e, u, v, w, m, x, y, z
        a, b, c, d, e, u, v, m, x, y
      }
    };

    const query = `mutation SetNewEntity( $input: InputEntity! ) {
                setEntity(input: $input) {
                  ${ '' /* Full set: a b c d e u v w m { a b m } x { a } y { a b m n z } z { a { a b c } } */ }
                  a
                }
              }
            `;

    fetchFirebase( query, variables );
  }

  function setProfile( data ) {

    const a = data.uuidP;
    const b = data.contextP;
    // const c = data.typeP;

    const m = {
      a: data.uuidE,
      // b: [data.uuidE], // owners
      // m: data.uuidE
    };

    const r = {
      a: data.props.descr,
      b: data.props.email,
      c: data.props.prefLangs,
      m: data.props.target,
      n: data.props.unit
    };
    const s = {
      a: data.geometry.coordinates,
      b: data.props.baseLocation,
      // c: [0, 0], // current Location
      // d: 'undefined',
      z: data.geometry.rand
    };
    const t = {
      a: 'some image data string',
      b: 'some image data string',
      c: 'some image data string'
    };

    const x = {
      a: [data.evmCredentials.address],
      b: data.receivingAddresses.evm
    };
    const y = {
      a: String( data.unix ),
      // b: String( data.unix ), // modified
    };
    // const z = { // changeLog
    //   a: [
    //     {
    //       a: String( data.unix ),
    //       b: ['Test', 'This'],
    //       c: ['only', 'test']
    //     }
    //   ]
    // };

    const variables = {
      input: {
        // full set: a, b, c, m, r, s, t, x, y, z
        a, b, m, r, s, t, x, y
      }
    };

    const query = `mutation SetNewProfile( $input: InputProfile! ) {
                setProfile(input: $input) {
                  ${ '' /* Full set: a, b, c, d, e, m { a }, r { a b c m n }, s { a b c d z }, t { a b c }, x { a } y { a b } z { a { a b c } } */ }
                  a
                }
              }
            `;

    fetchFirebase( query, variables );
  }

  function fetchFirebase( query, variables ) {
    fetch( 'http://localhost:5001/entity-namespace/us-central1/api/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify( {
        query,
        variables: variables,
      } )
    } )
      .then( r => {return r.json()} )
      .then( data => {
        console.log( 'data returned:', data );
      }
      );
  }

  /* ================== public methods ================== */

  function getFirebase() {
    console.log( 'todo: getting firebase data' );
    return Promise.resolve( 'test' );
  }

  function setFirebase( data ) {
    setProfile( data );
    setEntityNamespace( data );
  }

  /* ====================== export ====================== */

  V.getFirebase = getFirebase;
  V.setFirebase = setFirebase;

  return {
    getFirebase: getFirebase,
    setFirebase: setFirebase,
  };

} )();
