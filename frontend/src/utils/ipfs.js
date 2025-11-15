import { create } from "ipfs-http-client";
// local IPFS Desktop API
const ipfs = create({ url: "http://127.0.0.1:5001/api/v0" });

export async function addFile(file) {
  const added = await ipfs.add(file);
  if (added.cid) return added.cid.toString();
  return added.path;
}

export async function addJSON(obj) {
  const buf = Buffer.from(JSON.stringify(obj));
  const added = await ipfs.add(buf);
  if (added.cid) return added.cid.toString();
  return added.path;
}
