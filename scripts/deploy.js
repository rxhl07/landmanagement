const hre = require("hardhat");
const fs = require("fs");
async function main() {
  // compile (useful if you run `node scripts/deploy.js`)
  await hre.run("compile");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const Land = await hre.ethers.getContractFactory("LandRegistry");
  const land = await Land.deploy();
  await land.deployed();
  console.log("LandRegistry deployed to:", land.address);

  const out = {
    address: land.address,
    abi: JSON.parse(land.interface.format("json"))
  };
  fs.mkdirSync("frontend/src/abis", { recursive: true });
  fs.writeFileSync("frontend/src/abis/LandRegistry.json", JSON.stringify(out, null, 2));
  console.log("Wrote frontend/src/abis/LandRegistry.json");
}
main().catch(e => { console.error(e); process.exit(1); });
