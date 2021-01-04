const VFirebase = ( function() { // eslint-disable-line no-unused-vars

  /**
   * V Core Module to connect to Firebase (Middleware)
   *
   */

  'use strict';

  /**
   * Single Entity View returns all relevant fields.
   * Fields may be undefined.
   */

  const singleE = 'a c d i j m n x { a } y { a b m } private';
  const singleP = 'm { a b c m n } n { a b } o { a b c }';

  /**
   * Preview View returns only a few fields:
   * UuidE, Type, UuidP, Title and Tag (from Entity)
   * Description, Location name, Thumbnail image (from Profile)
   */

  const previewsE = 'a c d m n';
  const previewsP = 'm { a } n { a } o { b }';

  /* ================== private methods ================= */

  function getEntities( data, whichEndpoint ) {
    let queryE;

    if ( 'entity by role' == whichEndpoint ) {
      console.log( 111, 'by Role' );
      queryE = `query GetEntitiesByRole {
             getEntity { ${ previewsE } }
           }`;
    }
    else if ( 'entity by evmAddress' == whichEndpoint ) {
      console.log( 222, 'by EVM Address' );
      queryE = `query GetEntityByEvmAddress {
          getEntity (i:"${ data }") { ${ singleE } }
        }`;
    }
    else if ( 'entity by fullId' == whichEndpoint ) {
      const tT = V.castFullId( data );
      console.log( 333, 'by FullId' );
      queryE = `query GetEntityByFullId {
          getEntity (m:"${ tT.title }",n:"${ tT.tag }") { ${ singleE } }
        }`;
    }
    return fetchFirebase( queryE );
  }

  function getProfiles( array ) {
    const uuidEs = array.map( item => item.d );
    const queryP = `query GetProfiles {
           getProfile (a: ${ V.castJson( uuidEs ) }) { ${ array.length == 1 ? singleP : previewsP } }
         }`;
    return fetchFirebase( queryP );
  }

  function getFirebaseAuth( data ) {
    const queryA = `query GetEntityAuth {
            getAuth (f:"${ data }") { f }
          }`;

    return fetchFirebase( queryA );
  }

  function setEntity( data ) {

    const a = data.uuidE;
    const b = data.contextE;
    const c = data.typeE;
    const d = data.uuidP;
    const e = data.uuidA;
    const g = data.issuer;

    const i = data.evmCredentials.address;
    const j = data.receivingAddresses.evm;

    const m = data.title;
    const n = data.tag;

    const x = {
      a: data.creatorUuid,
    };

    const y = {
      a: String( data.unix ),
      c: String( data.expires ),
      m: data.active,
      z: data.statusCode,
    };

    const variables = {
      input: {
        a, b, c, d, e, g, i, j, m, n, x, y
      }
    };

    const query = `mutation SetNewEntity( $input: InputEntity! ) {
                setEntity(input: $input) {
                  ${ singleE }
                }
              }
            `;

    return fetchFirebase( query, variables );
  }

  function setProfile( data ) {

    const a = data.uuidP;
    const b = data.contextP;
    const d = data.uuidE; // note that this is NOT creatorUuid

    const m = {
      a: data.props.descr,
      b: data.props.email,
      c: data.props.prefLangs,
      m: data.props.target,
      n: data.props.unit
    };
    const n = {
      a: data.geometry.coordinates,
      b: data.props.baseLocation,
      z: data.geometry.rand
    };
    const o = {
      a: data.tinyImageDU,
      b: data.thumbnailDU,
      c: data.mediumImageDU
    };

    const x = {
      a: data.creatorUuid ? data.creatorUuid : data.uuidE,
    };

    const y = {
      a: String( data.unix ),
    };

    const variables = {
      input: {
        a, b, d, m, n, o, x, y
      }
    };

    const query = `mutation SetNewProfile( $input: InputProfile! ) {
                setProfile(input: $input) {
                  ${ singleP }
                }
              }
            `;

    return fetchFirebase( query, variables );
  }

  function setEntityField( data ) {
    console.log( 'UPDATING ENTITY: ', data );
    const a = V.getLastViewed().uuidE;

    let j, m, returnFields;

    switch ( data.field ) {
    case 'title':
      m = data.data;
      returnFields = 'm';
      break;
    case 'role':
      c = data.data;
      returnFields = 'c';
      break;
    case 'receivingAddresses.evm':
      j = data.data;
      returnFields = 'j';
      break;
    }

    const variables = {
      input: {
        a, j, m,
      }
    };

    const query = `mutation SetEntityUpdate( $input: InputEntity! ) {
                setEntity(input: $input) {
                  ${ returnFields + ' ' + 'error' }
                }
              }
            `;

    return fetchFirebase( query, variables );
  }

  function setProfileField( data ) {
    console.log( 'UPDATING PROFILE: ', data );
    const a = V.getLastViewed().uuidP;

    let m, n, o;

    let returnFields = 'm { a b c m n }';

    switch ( data.field ) {
    case 'properties.description':
      m = { a: data.data };
      break;
    case 'social.email':
      m = { b: data.data };
      break;
    case 'properties.preferredLangs':
      m = { c: data.data };
      break;
    case 'properties.target':
      m = { m: Number( data.data ) };
      break;
    case 'properties.unit':
      m = { n: data.data };
      break;

    case 'properties.baseLocation':
      n = {
        a: [ Number( data.data.lng ), Number( data.data.lat ) ],
        b: data.data.value,
        z: data.data.rand
      };
      returnFields = 'n { a b }';
      break;

    case 'images':
      o = {
        a: data.data.tiny.dataUrl,
        b: data.data.thumb.dataUrl,
        c: data.data.medium.dataUrl
      };
      break;
    }

    const variables = {
      input: {
        a, m, n, o
      }
    };

    const query = `mutation SetProfileUpdate( $input: InputProfile! ) {
                setProfile(input: $input) {
                  ${ returnFields + ' ' + 'error' }
                }
              }
            `;

    return fetchFirebase( query, variables );
  }

  function castEntityData( E, P ) {
    const fullId = V.castFullId( E.m, E.n );
    return {
      uuidE: E.a || P.d,
      uuidP: E.d || P.a,
      fullId: fullId,
      path: V.castPathOrId( fullId ),
      evmCredentials: {
        address: E.i
      },
      receivingAddresses: {
        evm: E.j
      },
      properties: {
        description: P.m ? P.m.a : undefined,
        email: P.m ? P.m.b : undefined,
        preferredLangs: P.m ? P.m.c : undefined,
        target: P.m ? P.m.m : undefined,
        unit: P.m ? P.m.n : undefined,
        baseLocation: P.n ? P.n.b : undefined, // placed here also for UI compatibility
      },
      relations: {
        creator: E.x ? E.x.a : E.a,
      },
      images: {
        tinyImage: P.o ? P.o.a : undefined,
        thumbnail: P.o ? P.o.b : undefined,
        mediumImage: P.o ? P.o.c : undefined
      },
      geometry: {
        coordinates: P.n ? P.n.a : undefined,
        baseLocation: P.n ? P.n.b : undefined,
        type: 'Point',
      },
      type: 'Feature', // needed to create a valid GeoJSON object for leaflet.js
      profile: {
        title: E.m,
        tag: E.n,
        role: E.c
      },
      social: {
        email: P.m ? P.m.b : undefined // placed here also for UI compatibility
      },
      status: { active: E.y ? E.y.m : undefined },

      private: {
        uPhrase: E.private
      },
      // for UI compatibility:
      adminOf: [fullId],
      owners: [{ ownerName: '', ownerTag: '' }],
    };
  }

  function fetchFirebase( query, variables ) {
    return fetch( 'http://localhost:5001/entity-namespace/us-central1/api/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': V.getCookie( 'last-active-uphrase' )
          ? V.getCookie( 'last-active-uphrase' ).replace( /"/g, '' )
          : ''
      },
      body: JSON.stringify( {
        query,
        variables: variables,
      } )
    } )
      .then( r => r.json() );
  }

  /* ================== public methods ================== */

  async function getFirebase( data, whichEndpoint ) {

    if ( 'entity by uPhrase' == whichEndpoint ) {
      const auth = await getFirebaseAuth( data );
      if ( !auth.errors && auth.data.getAuth[0] != null ) {
        return {
          success: true,
          status: 'fetched firebase auth doc',
          data: [{ private: { uPhrase: auth.data.getAuth[0].f } }]
        };
      }
      else {
        return {
          success: false,
          message: 'could not fetch firebase auth doc'
        };
      }
    }

    /** Query entities */

    const entities = await getEntities( data, whichEndpoint );

    /** Query profiles for entities fetched */

    if ( !entities.errors && entities.data.getEntity[0] != null ) {
      const profiles = await getProfiles( entities.data.getEntity );

      /** Combine profile and entity data */

      if ( !profiles.errors && profiles.data.getProfile[0] != null ) {
        const combined = entities.data.getEntity.map( ( item, i ) =>
          castEntityData( item, profiles.data.getProfile[i] )
        );
        return {
          success: true,
          status: 'fetched firebase',
          data: combined
        };
      }
      else {
        return {
          success: false,
          message: 'could not fetch firebase profiles'
        };
      }
    }
    else {
      return {
        success: false,
        message: 'could not fetch firebase entities'
      };
    }
  }

  function setFirebase( data, whichEndpoint  ) {
    if ( 'entity' == whichEndpoint ) {
      return setEntity( data )
        .then( async E => {
          const P = await setProfile( data );
          const entityData = castEntityData( E.data.setEntity, P.data.setProfile );
          return {
            success: true,
            status: 'firebase entity set',
            data: [ entityData ]
          };
        } )
        .catch( err => ( {
          success: false,
          message: 'error with setting Firebase: ' + err
        } ) );
    }
    else if ( 'entity update' == whichEndpoint ) {
      if ( ['title', 'role', 'receivingAddresses.evm'].includes( data.field ) ) {
        return setEntityField( data )
          .then( P => {
            if ( !P.data.setEntity.error ) {
              return {
                success: true,
                status: 'Firebase entity updated',
                data: [ P.data.setEntity ]
              };
            }
            else {
              return {
                success: false,
                status: 'could not update Firebase entity: ' + P.data.setEntity.error,
                data: [ P.data.setEntity ]
              };
            }
          } )
          .catch( err => ( {
            success: false,
            message: 'error with updating entity in Firebase: ' + err
          } ) );
      }
      else {
        return setProfileField( data )
          .then( P => {
            if ( !P.data.setProfile.error ) {
              return {
                success: true,
                status: 'Firebase profile updated',
                data: [ P.data.setProfile ]
              };
            }
            else {
              return {
                success: false,
                status: 'could not update Firebase profile: ' + P.data.setProfile.error,
                data: [ P.data.setProfile ]
              };
            }
          } )
          .catch( err => ( {
            success: false,
            message: 'error with updating profile in Firebase: ' + err
          } ) );
      }
    }
  }

  /* ====================== export ====================== */

  V.getFirebase = getFirebase;
  V.setFirebase = setFirebase;

  return {
    getFirebase: getFirebase,
    setFirebase: setFirebase,
  };

} )();
