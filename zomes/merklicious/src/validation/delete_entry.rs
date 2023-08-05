use crate::hdk::prelude::{
    hdi,
    debug,
};
use crate::hdi::prelude::*;
use crate::hdi_extensions::{
    summon_create_action,
    detect_app_entry_unit,
    // Macros
    invalid,
};
use crate::{
    EntryTypesUnit,
};


pub fn validation(
    original_action_hash: ActionHash,
    _original_entry_hash: EntryHash,
    _delete: Delete
) -> ExternResult<ValidateCallbackResult> {
    let create = summon_create_action( &original_action_hash )?;

    match detect_app_entry_unit( &create )? {
        EntryTypesUnit::Tree => {
            debug!("Checking delete EntryTypesUnit::Tree");
            invalid!("Trees cannot be deleted".to_string())
        },
        // entry_type_unit => invalid!(format!("Delete validation not implemented for entry type: {:?}", entry_type_unit )),
    }
}
