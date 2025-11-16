import React, { useState } from "react";
import { addFile, addJSON } from "../utils/ipfs";
import { ethers } from "ethers";
import contractDeployment from "../abis/LandRegistry.json";
import { Buffer } from 'buffer';

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
      
      // --- MODIFICATION START ---
      // Wait for the transaction to be mined and get the receipt
      const receipt = await tx.wait();
      
      // Find the 'Transfer' event in the transaction receipt
      const event = receipt.events.find(event => event.event === 'Transfer');
      
      // Get the Token ID from the event arguments
      // Note: The 'Transfer' event for ERC721 is: event Transfer(address from, address to, uint256 tokenId)
      // So, tokenId is the 3rd argument (index 2), or we can access it by name.
      const tokenId = event.args.tokenId.toString(); 

      // Log the information to the browser's console (F12)
      console.log("NFT MINTED!");
      console.log("Contract Address:", contract.address);
      console.log("Token ID:", tokenId);
      console.log("Transaction Hash:", receipt.transactionHash);

      // Update the status message to include the new Token ID
      setStatus(`Minted! Token ID: ${tokenId} | metadata: ipfs://${metaCidLocal}`);
      // --- MODIFICATION END ---

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