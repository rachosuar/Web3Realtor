import { useEffect, useState } from "react";
import { ethers } from "ethers";

import EscrowAbi from "./abis/Escrow.json";
import RealEstateAbi from "./abis/RealEstate.json";

// Components
import Navigation from "./components/Navigation";
import Search from "./components/Search";
import Home from "./components/Home";

// ABIs

// Config
import config from "./config.json";

function App() {
  const [provider, setProvider] = useState(null);
  const [escrow, setEscrow] = useState();
  const [realEstate, setRealEstate] = useState();

  const [account, setAccount] = useState(null);
  const [Network, setNetwork] = useState();
  const [home, setHome] = useState(null);
  const [homes, setHomes] = useState([]);
  const [toggle, setToggle] = useState(false);

  //here the Blockchain links with the ReactApp
  useEffect(() => {
    const loadBlockchainData = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum); //complete using ethers
      setProvider(provider);
      const network = await provider.getNetwork(); // complete with await and get the network
      setNetwork(network.chainId);
      let ethSigner = provider.getSigner();

      //conecting RealEstate Contract.

      const realEstateInstance = new ethers.Contract(
        config[network.chainId].realEstate.address,
        RealEstateAbi,
        ethSigner
      ); // create an instance with ethers use  (must include properties )
      setRealEstate(realEstateInstance);

      let totalSupply = (await realEstateInstance.totalSupply()).toNumber();

      let responses = [];
      for (var i = 1; i <= totalSupply; i++) {
        const uri = await realEstateInstance.tokenURI(i);
        const finalUri = `https://ipfs.io${uri}`;
        const response = await fetch(finalUri, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }).then((res) => {
          res.json();
        });

        responses.push(response);
        setHomes(responses);
      }
      const escrowInstance = new ethers.Contract(
        config[network.chainId].escrow.address,
        EscrowAbi,
        ethSigner
      );
      setEscrow(escrowInstance);
      window.ethereum.on("accountsChanged", async () => {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = ethers.utils.getAddress(accounts[0]);
        setAccount(account);
      });
    };
    loadBlockchainData();
  }, [account]);

  //

  //   setHomes(homes)

  //   //Interaction with Connect Metamask button
  //   ... , async () => {//*use window.ethereum 'accountsChanged' as async function
  //   const accounts = // *use await +window ethereum + requestAccount method*
  //   const account = //use ethers to get the address
  //   setAccount(account);
  //   }
  // useEffect(() => {
  //   loadBlockchainData()
  // }, [])

  const togglePop = (home) => {
    setHome(home);
    toggle ? setToggle(false) : setToggle(true);
  };
  console.log(homes);
  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      {Network == 31337 ? (
        <Search />
      ) : (
        <div className={"hardhatNet"}>
          <h1>Switch to Hardhat Network</h1>
        </div>
      )}

      <div className="cards__section">
        <h3>Homes For You</h3>

        <hr />

        <div className="cards">
          {homes.length == 3
            ? homes.map((home, index) => (
                <div
                  className="card"
                  key={index}
                  onClick={() => togglePop(home)}
                >
                  <div className="card__image">
                    <img src={`https://ipfs.io/${home.image}`} alt="Home" />
                  </div>
                  <div className="card__info">
                    <h4>{home.attributes[0].value} ETH</h4>
                    <p>
                      <strong>{home.attributes[2].value}</strong> bds |
                      <strong>{home.attributes[3].value}</strong> ba |
                      <strong>{home.attributes[4].value}</strong> sqft
                    </p>
                    <p>{home.address}</p>
                  </div>
                </div>
              ))
            : null}
        </div>
      </div>

      {toggle && (
        <Home
          home={home}
          provider={provider}
          account={account}
          escrow={escrow}
          realEstate={realEstate}
          togglePop={togglePop}
        />
      )}
    </div>
  );
}

export default App;
