// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LandRegistry is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;
    mapping(bytes32 => uint256) public surveyHashToToken;

    event LandMinted(address indexed owner, uint256 indexed tokenId, bytes32 surveyHash, string tokenURI);

    constructor() ERC721("LandNFT", "LAND") {}

    function mintLand(string calldata tokenURI, bytes32 surveyHash) external returns (uint256) {
        require(surveyHashToToken[surveyHash] == 0, "Survey already registered");
        uint256 tid = ++nextTokenId;
        _safeMint(msg.sender, tid);
        _setTokenURI(tid, tokenURI);
        surveyHashToToken[surveyHash] = tid;
        emit LandMinted(msg.sender, tid, surveyHash, tokenURI);
        return tid;
    }

    function isSurveyRegistered(bytes32 surveyHash) external view returns (bool) {
        return surveyHashToToken[surveyHash] != 0;
    }
}
