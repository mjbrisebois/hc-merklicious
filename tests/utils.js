
import { expect }			from 'chai';
import { faker }			from '@faker-js/faker';
import ObjectWalk			from '@whi/object-walk';


export async function expect_reject ( cb, error, message ) {
    let failed				= false;
    try {
	await cb();
    } catch (err) {
	failed				= true;
	expect( () => { throw err }	).to.throw( error, message );
    }
    expect( failed			).to.be.true;
}

export function linearSuite ( name, setup_fn ) {
    describe( name, function () {
	beforeEach(function () {
	    let parent_suite		= this.currentTest.parent;
	    if ( parent_suite.tests.some(test => test.state === "failed") )
		this.skip();
	    if ( parent_suite.parent?.tests.some(test => test.state === "failed") )
		this.skip();
	});
	setup_fn.call( this );
    });
}

export function createTreeInput ( admins, ...members ) {
    return {
	"admins": admins,
	"members": [ ...members ],

	"published_at":		Date.now(),
	"last_updated":		Date.now(),
	"metadata":		{},
    };
};

export function flatten_data ( data ) {
    const leaves		= [];

    ObjectWalk.walk( data, function ( key, value, path ) {
	const is_object		= typeof value === "object" && value !== null;

	if ( is_object && ["Buffer", "Uint8Array"].includes(value.constructor.name)  )
	    return;

	if ( !is_object ) {
	    leaves.push({
		"label": path.join("."),
		value,
	    })
	}
	return value;
    });

    return leaves;
}


export default {
    expect_reject,
    flatten_data,
    linearSuite,
    createTreeInput,
};
