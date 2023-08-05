
import ObjectWalk			from '@whi/object-walk';


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
    flatten_data,
};
