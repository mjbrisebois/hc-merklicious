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
    EntryTypes,
};

pub fn validation(
    app_entry: EntryTypes,
    create: Create
) -> ExternResult<ValidateCallbackResult> {
    match app_entry {
        EntryTypes::Tree(_tree) => {
            debug!("Checking EntryTypes::Tree");
            valid!()
        },
        _ => invalid!(format!("Create validation not implemented for entry type: {:#?}", create.entry_type )),
    }
}
