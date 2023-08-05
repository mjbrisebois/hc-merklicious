use crate::hdk::prelude::{
    hdi,
    debug,
};
use crate::hdi::prelude::*;
use crate::hdi_extensions::{
    // Macros
    valid, invalid,
};
use crate::{
    LinkTypes,
};


pub fn validation(
    original_action_hash: ActionHash,
    _base_address: AnyLinkableHash,
    delete: DeleteLink,
) -> ExternResult<ValidateCallbackResult> {
    let record = must_get_valid_record( original_action_hash )?;
    let create_link = match record.action() {
        Action::CreateLink(action) => action,
        _ => invalid!(format!("Original action hash does not belong to create link action")),
    };
    let link_type = match LinkTypes::from_type( create_link.zome_index, create_link.link_type )? {
        Some(lt) => lt,
        None => invalid!(format!("No match for LinkTypes")),
    };

    match link_type {
        LinkTypes::Tree => {
            debug!("Checking LinkTypes::Tree delete");
            // These can be deleted by the original author of the link
            if create_link.author != delete.author {
                invalid!(format!("A group link can only be deleted by the author who created it ({})", create_link.author ))
            }

            valid!()
        },
    }
}
