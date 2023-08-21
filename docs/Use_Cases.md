[back to README.md](../README.md)


# Use Cases

For the purposes of these examples, we are going to assume a `client` has already been intiated and
scoped to the `merklicious_csr` zome.  Depending on the client you are using, a cell and zome name
would have to be known for the calls to work properly.


## Basic Example

Let's use this fake data based on Count Dracula that represents information that would be on a
typical identity card.

```js
const data_blocks = [{
    "label": "name.first",
    "value": "Count",
},{
    "label": "name.last",
    "value": "Dracula",
},{
    "label": "address.street",
    "value": "Str. G-ral Traian Mosoiu, nr.24, Bran",
},{
    "label": "address.city",
    "value": null,
},{
    "label": "address.region",
    "value": "Transylvania",
},{
    "label": "address.country",
    "value": "Romania",
},{
    "label": "date_of_birth",
    "value": "1476-12-14",
},{
    "label": "appearance.height",
    "value": "{\"value\"193,\"unit\":\"cm\"}",
},{
    "label": "appearance.weight",
    "value": "{\"value\":102,\"unit\":\"kg\"}",
},{
    "label": "organ_donor",
    "value": false,
}]
```

Now that we have the data blocks, let's create a tree.

```js
const tree_addr = await client.call( "create_tree", {
    "leaves": data_blocks,
});
```

What does that tree we just created look like?

```js
const tree = await client.call( "get_tree", tree_addr );
// {
//     "data_blocks": Uint8Array { 132, 41, 36, 202, 194, 92, 2, 80, 149, 88, 123, 155, 193, 215, 56, 197, 223, 216, 5, 202, 137, 68, 133, 89, 60, 43, 67, 57, 24, 104, 223, 169, 107, 42, 134, 165, 155, 7, 76 },
//     "leaves": [
//         [ 99, 42, 138, 80, 0, 133, 118, 21, 240, 253, 10, 104, 13, 222, 178, 73, 158, 222, 81, 30, 173, 208, 92, 7, 21, 218, 149, 79, 31, 252, 122, 113 ],
//         [ 251, 86, 37, 68, 39, 166, 151, 188, 234, 117, 171, 227, 250, 19, 109, 45, 62, 74, 176, 31, 61, 223, 213, 36, 85, 117, 193, 75, 204, 173, 13, 125 ],
//         [ 93, 57, 84, 54, 174, 156, 48, 115, 230, 198, 165, 47, 85, 226, 230, 142, 94, 115, 91, 33, 60, 221, 137, 81, 84, 179, 254, 11, 192, 130, 214, 79 ],
//         [ 254, 44, 220, 164, 117, 31, 194, 93, 29, 115, 62, 160, 49, 10, 35, 242, 191, 120, 251, 148, 108, 99, 183, 217, 34, 250, 117, 255, 90, 85, 218, 198 ],
//         [ 28, 232, 34, 155, 188, 106, 36, 61, 148, 80, 89, 214, 95, 38, 28, 134, 87, 148, 240, 156, 74, 157, 170, 111, 186, 192, 67, 152, 146, 19, 71, 171 ],
//         [ 71, 60, 80, 21, 119, 194, 255, 247, 194, 196, 138, 55, 237, 176, 91, 104, 121, 72, 59, 85, 22, 251, 84, 59, 189, 237, 93, 207, 107, 90, 62, 33 ],
//         [ 190, 83, 100, 224, 137, 207, 212, 187, 139, 251, 144, 222, 182, 7, 133, 126, 26, 243, 38, 233, 138, 19, 74, 239, 130, 58, 225, 219, 245, 101, 177, 115 ],
//         [ 50, 193, 151, 189, 207, 1, 223, 249, 102, 90, 172, 108, 133, 15, 38, 162, 43, 229, 246, 246, 147, 194, 250, 224, 253, 92, 89, 164, 60, 139, 27, 228 ],
//         [ 210, 96, 2, 247, 55, 218, 255, 51, 26, 96, 81, 23, 43, 189, 148, 165, 186, 229, 196, 143, 246, 46, 115, 44, 60, 64, 88, 211, 28, 86, 179, 16 ],
//         [ 110, 197, 53, 19, 37, 10, 243, 168, 16, 200, 240, 82, 47, 175, 186, 85, 206, 166, 18, 185, 213, 190, 109, 130, 98, 146, 29, 188, 186, 189, 187, 71 ]
//     ],
//     "entropy": [ 251, 208, 84, 39, 85, 137, 123, 208, 107, 28, 102, 251, 23, 110, 172, 154, 81, 149, 137, 10, 57, 116, 254, 48, 184, 83, 12, 56, 186, 12, 160, 59 ],
//     "root": [ 107, 242, 187, 48, 33, 146, 131, 65, 74, 226, 177, 250, 80, 112, 103, 249, 77, 134, 195, 249, 155, 140, 7, 142, 223, 115, 105, 43, 124, 139, 118, 163 ],
//     "metadata": {}
// }
```

### Generate proof of a single leaf

```js
const details = await client.call( "get_leaf_proof", {
    "tree_id": tree_addr,
    "label": "date_of_birth",
});
// {
//     "proof": [
//         [ 50, 193, 151, 189, 207, 1, 223, 249, 102, 90, 172, 108, 133, 15, 38, 162, 43, 229, 246, 246, 147, 194, 250, 224, 253, 92, 89, 164, 60, 139, 27, 228 ],
//         [ 91, 46, 23, 26, 89, 117, 124, 54, 64, 229, 121, 229, 133, 4, 136, 115, 113, 212, 192, 254, 91, 236, 140, 41, 21, 163, 90, 88, 232, 17, 7, 34 ],
//         [ 66, 125, 209, 134, 197, 158, 186, 170, 211, 213, 187, 128, 126, 151, 127, 175, 206, 240, 25, 107, 69, 59, 233, 47, 103, 205, 218, 251, 16, 33, 198, 40 ],
//         [ 30, 231, 82, 199, 237, 180, 42, 27, 178, 47, 197, 179, 216, 200, 126, 247, 178, 64, 66, 80, 120, 239, 94, 111, 162, 235, 81, 1, 62, 127, 182, 246 ]
//     ],
//     "index": 6,
//     "target": {
//         "label": "date_of_birth",
//         "value": "1476-12-14",
//         "salt": Uint8Array { 51, 179, 216, 171, 183, 141, 243, 36, 245, 182, 32, 101, 174, 129, 137, 191, 203, 250, 60, 233, 141, 102, 122, 240, 215, 136, 45, 172, 205, 97, 118, 39 }
//     },
//     "leaf": [ 190, 83, 100, 224, 137, 207, 212, 187, 139, 251, 144, 222, 182, 7, 133, 126, 26, 243, 38, 233, 138, 19, 74, 239, 130, 58, 225, 219, 245, 101, 177, 115 ],
//     "root": [ 107, 242, 187, 48, 33, 146, 131, 65, 74, 226, 177, 250, 80, 112, 103, 249, 77, 134, 195, 249, 155, 140, 7, 142, 223, 115, 105, 43, 124, 139, 118, 163 ],
//     "total_leaves": 10
// }
```

As you can see in the returned payload we have the revealed leaf data block.  After sending that
proof to some other agent, they will be able to verify the revealed data

```js
const verify = await client.call( "verify_leaf_proof", {
    "tree_id": tree_addr,
    "proof": details.proof,
    "index": details.index,
    "leaf": details.leaf,
    "root": details.root,
    "total_leaves": details.total_leaves,
});
// true
```

But how can we be sure that the data does indeed belong to the leaf hash?  In order to verify the
revealed data, we can hash it and check if it matches the leaf hash.

```js
const target_hash = await client.call( "hash_data_block", details.target );
// [ 190, 83, 100, 224, 137, 207, 212, 187, 139, 251, 144, 222, 182, 7, 133, 126, 26, 243, 38, 233, 138, 19, 74, 239, 130, 58, 225, 219, 245, 101, 177, 115 ]
```

If `target_hash` is equal to `details.leaf`, then the revealed data is genuine.
