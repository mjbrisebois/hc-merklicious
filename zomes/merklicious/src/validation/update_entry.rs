use crate::hdk::prelude::{
    hdi,
    debug,
};
use crate::hdi::prelude::*;
use crate::hdi_extensions::{
    // Macros
    // valid,
    invalid,
};
use crate::{
    EntryTypes,
};

pub fn validation(
    app_entry: EntryTypes,
    _update: Update,
    _original_action_hash: ActionHash,
    _original_entry_hash: EntryHash
) -> ExternResult<ValidateCallbackResult> {
    match app_entry {
        EntryTypes::Tree(tree) => {
            debug!("Checking update EntryTypes::Tree({:#?})", tree );
            invalid!(format!("Merkle Trees cannot be updated; use Create instead"))
        },
        // _ => invalid!(format!("Update validation not implemented for entry type: {:#?}", update.entry_type )),
    }
}
