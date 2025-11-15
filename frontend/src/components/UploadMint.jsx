import React, { useState } from "react";
import { addFile, addJSON } from "../utils/ipfs";
import { ethers } from "ethers";
import contractDeployment from "../abis/LandRegistry.json";

function normSurvey(s) { return String(s).trim().toLowerCase(); }

export default function UploadMint() {
  const [survey, setSurvey] = useState("");
  const [addr, setAddr] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [metaCid, setMetaCid] = useState("");

  async function connectProvider() {
    if (!window.ethereum) throw new Error("Install MetaMask");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    return provider;
  }

  async function handleMint() {
    try {
      if (!survey) throw new Error("Enter survey number");
      setStatus("Uploading file to IPFS...");
      let imageCid = "";
      if (file) imageCid = await addFile(file);

      setStatus("Pinning metadata...");
      const metadata = {
        name: `Survey ${survey}`,
        description: `Survey ${survey} - ${addr}`,
        surveyNumber: survey,
        address: addr,
        image: imageCid ? `ipfs://${imageCid}` : "",
        createdAt: new Date().toISOString()
      };
      const metaCidLocal = await addJSON(metadata);
      setMetaCid(metaCidLocal);

      setStatus("Computing survey hash...");
      const normalized = normSurvey(survey);
      const surveyHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(normalized));

      setStatus("Connecting wallet...");
      const provider = await connectProvider();
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractDeployment.address, contractDeployment.abi, signer);

      const already = await contract.isSurveyRegistered(surveyHash);
      if (already) { setStatus("Survey already registered on-chain. Aborting."); return; }

      setStatus("Sending mint transaction (confirm MetaMask)...");
      const tx = await contract.mintLand(`ipfs://${metaCidLocal}`, surveyHash);
      await tx.wait();
      setStatus(`Minted! metadata: ipfs://${metaCidLocal}`);
    } catch (e) {
      console.error(e);
      setStatus("Error: " + (e.message || e));
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div><label>Survey number</label><input value={survey} onChange={e=>setSurvey(e.target.value)} /></div>
      <div><label>Address</label><input value={addr} onChange={e=>setAddr(e.target.value)} /></div>
      <div><label>Image</label><input type="file" onChange={e=>setFile(e.target.files[0])} /></div>
      <button onClick={handleMint}>Upload & Mint</button>
      <div style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{status}</div>
      {metaCid && <div>metadata: ipfs://{metaCid}</div>}
    </div>
  );
}
