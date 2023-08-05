use crate::hdk::prelude::{
    hdi,
    debug,
};
use crate::hdi::prelude::*;
use crate::hdi_extensions::{
    verify_app_entry_struct,
    // Macros
    valid, invalid,
};
use crate::{
    // EntryTypes,
    LinkTypes,
    TreeEntry,
};


pub fn validation(
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    link_type: LinkTypes,
    _tag: LinkTag,
    create: CreateLink,
) -> ExternResult<ValidateCallbackResult> {
    match link_type {
        LinkTypes::Tree => {
            debug!("Checking LinkTypes::Tree");
            // Tree base should be an AgentPubKey
            let agent_pubkey = match base_address.clone().into_agent_pub_key() {
                Some(hash) => hash,
                None => invalid!(format!("Tree link base address must be an agent pubkey; not '{}'", base_address )),
            };

            if agent_pubkey != create.author {
                invalid!(format!("Creating a link based on an agent pubkey can only be made by the matching agent ({})", agent_pubkey ))
            }

            // Tree target should be a TreeEntry
            verify_app_entry_struct::<TreeEntry>( &target_address )?;

            valid!()
        },
    }
}
