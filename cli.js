const inquirer = require('inquirer');
const clearConsole = require('clear-console');
const fs = require('fs');
const path = require('path');
const { Keypair, Connection, SystemProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');
const walletFilePath = path.join(__dirname, 'wallets.json');
const addExistingWallet = (name, privateKey) => {
    const { wallets } = readWalletsFile();
    const privateKeyBuffer = Uint8Array.from(bs58.decode(privateKey));
    // Replace privateKeyHex with the hexadecimal representation of your private key
    // Create a Keypair using the private key
    const keypair = Keypair.fromSecretKey(privateKeyBuffer);

    // Get the public key from the keypair
    const publicKey = keypair.publicKey.toBase58(); 
    const updatedWallets = [...wallets, { name, publicKey, privateKey }];
    writeWalletsFile(updatedWallets);
  };
// Function to read the content of the JSON file
const readWalletsFile = () => {
  try {
    const fileContent = fs.readFileSync(walletFilePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If the file doesn't exist or is invalid, return an empty array
    return { wallets: [] };
  }
};
const displayWalletNames = () => {
    const { wallets } = readWalletsFile();
  
    if (wallets.length === 0) {
      console.log('No wallets found.');
    } else {
      console.log('Wallet names:');
      wallets.forEach(wallet => console.log(wallet.name));
    }
  };
// Function to write the updated content to the JSON file
const writeWalletsFile = (wallets) => {
  const updatedContent = JSON.stringify({ wallets }, null, 2);
  fs.writeFileSync(walletFilePath, updatedContent, 'utf8');
};
const addWallet = (name, publicKey, privateKey) => {
    const { wallets } = readWalletsFile();
    const updatedWallets = [...wallets, { name, publicKey, privateKey }];
    writeWalletsFile(updatedWallets);
  };
const displayHeader = () => {
    console.log(`
    ██████╗  █████╗ ██████╗ ██╗      ██████╗     ████████╗ ██████╗  ██████╗ ██╗     ███████╗
    ██╔══██╗██╔══██╗██╔══██╗██║     ██╔═══██╗    ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝
    ██████╔╝███████║██████╔╝██║     ██║   ██║       ██║   ██║   ██║██║   ██║██║     ███████╗
    ██╔══██╗██╔══██║██╔══██╗██║     ██║   ██║       ██║   ██║   ██║██║   ██║██║     ╚════██║
    ██████╔╝██║  ██║██████╔╝███████╗╚██████╔╝       ██║   ╚██████╔╝╚██████╔╝███████╗███████║
    ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝ ╚═════╝        ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
                                                                                            
    `);
  console.log('                                                                                                                                                                         ');
};

function uint8ArrayToPublicKey(uint8Array) {
    const publicKeyBase58 = bs58.encode(uint8Array);
    return publicKeyBase58;
  }
async function createNewWallet(name) {
  // Connect to the Solana network
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

  // Generate a new keypair (public and private key pair)
  const newWallet = Keypair.generate();

  // Create a new System Program transaction to fund the new account
 

  // Sign and send the transaction
  addWallet(name, newWallet.publicKey.toBase58(), uint8ArrayToPublicKey(newWallet.secretKey));

  console.log('New wallet created successfully!');
  console.log('Public Key:', newWallet.publicKey.toBase58());
  console.log('Private Key:', uint8ArrayToPublicKey(newWallet.secretKey));

}
// ... (existing code)

const mainMenu = async () => {
    let exit = false;
  
    while (!exit) {
        const clearConsole = () => {
            console.clear();
          }; // Clear the console before displaying a new menu
      displayHeader(); // Display the header
  
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Choose an action:',
          choices: ['Manage Solana Wallets', 'Create Solana Wallet', 'Exit'],
        },
      ]);
  
      switch (answers.action) {
        case 'Manage Solana Wallets':
          const answerManage = await inquirer.prompt([
            {
              type: 'list',
              name: 'action',
              message: 'Choose an action:',
              choices: ['Create a new wallet', 'Add existing wallet', 'View my wallets', 'Back'],
            },
          ]);
          clearConsole();
          switch (answerManage.action) {
            case 'Create a new wallet':
              console.log('You chose to create a Solana wallet.');
              await wait(2000);
              const baseWalletNameAnswer = await inquirer.prompt([
                  {
                      type: 'input',
                      name: 'baseWalletName',
                      message: 'Enter a base name for the new wallets:',
                      validate: (input) => {
                          if (!input.trim()) {
                              return 'Please enter a valid base name for the wallets.';
                          }
                          return true;
                      },
                  },
              ]);
          
              const numberOfWalletsAnswer = await inquirer.prompt([
                  {
                      type: 'number',
                      name: 'numberOfWallets',
                      message: 'Enter the number of wallets to create:',
                      validate: (input) => {
                          const numberOfWallets = parseInt(input, 10);
                          if (isNaN(numberOfWallets) || numberOfWallets <= 0) {
                              return 'Please enter a valid number greater than 0.';
                          }
                          return true;
                      },
                  },
              ]);
          
              for (let i = 0; i < numberOfWalletsAnswer.numberOfWallets; i++) {
                  const walletName = `${baseWalletNameAnswer.baseWalletName}${i + 1}`;
                  createNewWallet(walletName);
                  console.log(`You created ${walletName} wallet`);
                  await wait(2000); // Adjust the delay as needed
              }
              clearConsole();
              break;
  
            case 'View my wallets':
              displayWalletNames();
              await wait(5000);
              clearConsole();
              break;
  
            case 'Add existing wallet':
              console.log('You chose to add an existing wallet.');
  
              const existingWalletAnswer = await inquirer.prompt([
                  {
                      type: 'input',
                      name: 'walletName',
                      message: 'Enter a name for the existing wallet:',
                      validate: (inputName) => {
                          if (!inputName.trim()) {
                              return 'Please enter a valid name for the wallet.';
                          }
                          return true;
                      },
                  },
                  {
                      type: 'input',
                      name: 'privateKey',
                      message: 'Enter the private key for the existing wallet:',
                      validate: (inputKey) => {
                          if (!inputKey.trim()) {
                              return 'Please enter a valid private key.';
                          }
                          // Add additional validation if needed
                          return true;
                      },
                  },
              ]);
              addExistingWallet(existingWalletAnswer.walletName, existingWalletAnswer.privateKey);
              console.log('Added wallet successfully');
              await wait(5000);
              clearConsole();
              break;
  
            case 'Back':
              break; // Will go back to the main menu
  
            default:
              console.log('Invalid choice.');
              await wait(2000);
          }
          break;
  
        case 'Exit':
          console.log('Exiting...');
          exit = true;
          break;
  
        default:
          console.log('Invalid choice.');
      }
    }
  };
  const wait = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));
  mainMenu();
  
