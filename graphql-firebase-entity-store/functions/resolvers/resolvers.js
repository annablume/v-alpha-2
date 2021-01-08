// Connect to firebase database
const namespaceDb = require( '../resources/databases-setup' ).namespaceDb;
const profileDb = require( '../resources/databases-setup' ).profileDb;
const authDb = require( '../resources/databases-setup' ).authDb;

const colE = namespaceDb.database().ref( 'entities' ); // col as in "collection"
const colP = profileDb.database().ref( 'profiles' );
const colA = authDb.database().ref( 'authentication' );

const settings = {
  useClientData: true,
};

const resolvers = {
  Query: {
    getEntity: ( parent, args, context ) => {
      if ( args.m && args.n ) {
        return findByFullId( context, args.m, args.n );
      }
      else if ( args.i ) {
        return findByEvmAddress( context, args.i );
      }
      else {
        return mapSnap( colE );
      }
    },
    getProfile: ( parent, args ) => findProfiles( colP, args.a ),
    getAuth: ( parent, args ) => findByToken( colA, args.f ),
  },
  Mutation: {
    setEntity: ( parent, input, context ) => setFields( colE, input, context ),
    setProfile: ( parent, input, context ) => setFields( colP, input, context ),
  },
};

function mapSnap( col ) {
  return col.once( 'value' )
    .then( snap => snap.val() )
    .then( val => Object.keys( val ).map( key => val[key] ) );
}

function findByFullId( context, m, n ) {
  const match = function( entity ) {
    return entity.m == m && entity.n == n;
  };
  return getSingleEntity( context, match );
}

function findByEvmAddress( context, i ) {
  const match = function( entity ) {
    return entity.i == i;
  };
  return getSingleEntity( context, match );
}

async function getSingleEntity( context, match ) {
  const DB = await colE.once( 'value' )
    .then( snap => snap.val() )
    .then( val => Object.values( val ) );

  const entity = DB.find( match );

  /**
   * mixin the fullIds of the current entity holders
   * currently requires "stringify" as workaround for possible bug in Apollo
   */
  const holdersFullIds = DB.filter( item => entity.r.includes( item.a ) ).map( item => item.m + ' ' + item.n );
  Object.assign( entity, { holders: holdersFullIds } );

  /** authorize the mixin of private data for authenticated user */
  if ( context.a && entity.r.includes( context.d ) ) {

    /** fetch related auth doc */
    const authDoc = await colA.child( entity.e ).once( 'value' )
      .then( snap => snap.val() );

    /** add auth token to entity object */
    Object.assign( entity, { auth: { f: authDoc.f, j: authDoc.j } } );
  }
  return [entity];
}

function findByToken( col, f ) {
  return col.once( 'value' )
    .then( snap => snap.val() )
    .then( val => [ Object.values( val ).find( entity => entity.f == f ) ] );
}

function findProfiles( col, a ) {
  return col.once( 'value' )
    .then( snap => snap.val() )
    .then( val => a.map( uuidP => val[uuidP] ) );
}

async function setFields( col, { input }, context ) {

  /** Cast a copy of input */
  const data = JSON.parse( JSON.stringify( input ) );

  /** Get the profile or entity object to be updated */
  const objToUpdate = await col.child( data.a ).once( 'value' )
    .then( snap => snap.val() );

  /** Determine set new or update action */

  /**
   * If no object to update was found, initialize a new set of data.
   * Either use client or server side initialisation.
   */
  if (
    !objToUpdate && settings.useClientData
  ) {
    return new Promise( resolve => {
      data.b == '/e1/v0' ? colA.child( data.auth.a ).update( data.auth ) : null;
      const omitAuth = JSON.parse( JSON.stringify( data ) );
      delete omitAuth.auth;
      // TODO: post-write data should be resolved, not pre-write data
      col.child( data.a ).update( omitAuth, () => resolve( data ) );
    } );
  }
  else if (
    !objToUpdate && !settings.useClientData
  ) {
    return new Promise( resolve => {
      // initializeEntity( data )
    } );
  }

  /**
   * If an object to update was found, check authentication and authorization.
   */
  else if (
    context.a && objToUpdate.r.includes( context.d )
  ) {

    /**
     * Cast Firebase-compatible object with paths, e.g.
     *      {'m': {'a': 'hello world'}}
     *   => {'m/a': 'hello world'}
     */

    const fields = castObjectPaths( data );

    /** Do not update uuid */
    delete fields.a;

    /** Update single fields */

    return new Promise( resolve => {
      col.child( data.a ).update( fields, () => resolve( data ) );
    } );
  }
  else if ( !context.a ) {
    return Promise.resolve( { error: 'not authenticated to update' } );
  }
  else {
    return Promise.resolve( { error: 'not authorized to update' } );
  }
}

function castObjectPaths( data ) {
  const newObj = {};
  for ( const k in data ) {
    if ( typeof data[k] == 'object' ) {
      for ( const k2 in data[k] ) {
        if ( typeof data[k][k2] == 'object' ) {
          for ( const k3 in data[k][k2] ) {
            newObj[k + '/' + k2 + '/' + k3] = data[k][k2][k3];
          }
        }
        else {
          newObj[k + '/' + k2] = data[k][k2];
        }
      }
    }
    else {
      newObj[k] = data[k];
    }
  }

  return newObj;
}

function setNewExpiryDate( context ) {
  const unix = Math.floor( Date.now() / 1000 );
  const expires = String( unix + 60 * 60 * 24 * 180 );
  const input = { input: { a: context.m, y: { c: expires } } };
  setFields( colE, input, context );
}

module.exports = resolvers;
