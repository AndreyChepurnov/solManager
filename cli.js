const inquirer = require('inquirer');
const clearConsole = require('clear-console');
const fs = require('fs');
const path = require('path');
const { Keypair, Connection, SystemProgram, Transaction, sendAndConfirmTransaction, PublicKey } = require('@solana/web3.js');
const bs58 = require('bs58');
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const walletFilePath = path.join(__dirname, 'wallets.json');
const addExistingWallet = (name, privateKey) => {
    const { wallets } = readWalletsFile();
    const isMain = wallets.length === 0 ? 1 : 0;
  
    const privateKeyBuffer = Uint8Array.from(bs58.decode(privateKey));
    const keypair = Keypair.fromSecretKey(privateKeyBuffer);
    const publicKey = keypair.publicKey.toBase58();
    const updatedWallets = [...wallets, { name, publicKey, privateKey, main: isMain }];
    writeWalletsFile(updatedWallets);
  };
  
  const distributeSolana = async (solanaAmount) => {
    const { wallets } = readWalletsFile();
  
    if (wallets.length === 0) {
      console.log('No wallets found.');
      await wait(20000);
      return;
    }
  
    const mainWallet = wallets.find(wallet => wallet.main === 1);
  
    if (!mainWallet) {
      console.log('No main wallet found.');
      await wait(20000);
      return;
    }
  
    const senderPrivateKey = mainWallet.privateKey;
    const receiverPublicKeys = wallets
      .filter(wallet => wallet.main !== 1)
      .map(wallet => wallet.publicKey);
  
    for (const receiverPublicKey of receiverPublicKeys) {
      await distributeSolanaToWallet(senderPrivateKey, receiverPublicKey, solanaAmount);

    }
  
    console.log(`Successfully distributed ${solanaAmount} Solana to all wallets.`);
    await wait(5000);
  };
  const distributeSolanaToWallet = async (senderPrivateKey, receiverPublicKey, solanaAmount) => {
    // Connect to the Solana network
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
    // Manually input sender and receiver keypairs
    const sender = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(senderPrivateKey)));
    const receiver = new Keypair({ publicKey: Uint8Array.from(bs58.decode(receiverPublicKey)) });
  
    // Fetch the sender's account information
    const senderAccountInfo = await connection.getAccountInfo(sender.publicKey);
  
    // Create a new Transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: receiver.publicKey,
        lamports: solanaAmount, // Adjust the amount as needed
      })

    );
  
    // Sign the transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [sender]);
  
    console.log(`Transaction successful! ${solanaAmount} Solana transferred to ${receiverPublicKey}`);
    console.log('Transaction Signature:', signature);
    await wait(2000);
  };
  const setMainWallet = async () => {
    const { wallets } = readWalletsFile();
  
    if (wallets.length === 0) {
      console.log('No wallets found.');
      await wait(2000);
      return;
    }
    const mainWallet = wallets.find(wallet => wallet.main === 1);
    const walletNames = wallets.map(wallet => wallet.name);
    const mainWalletName = wallets.find(wallet => wallet.main === 1).name;
    console.log(`Current main wallet is: ${mainWalletName}`);
    const answerSetMain = await inquirer.prompt([
      {
        type: 'list',
        name: 'walletName',
        message: 'Choose a wallet to set as the main wallet:',
        choices: [mainWalletName, ...walletNames.filter(name => name !== mainWalletName)],
      },
    ]);
  
    const updatedWallets = wallets.map(wallet => {
      if (wallet.name === answerSetMain.walletName) {
        return { ...wallet, main: 1 };
      } else {
        return { ...wallet, main: 0 };
      }
    });
  
    writeWalletsFile(updatedWallets);
    console.log(`${answerSetMain.walletName} set as the main wallet successfully!`);
    await wait(2000);
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
const deleteWallet = async () => {
    const { wallets } = readWalletsFile();
  
    if (wallets.length === 0) {
      console.log('No wallets found.');
      await wait(2000)
      return;
    }
  
    const walletNames = wallets.map(wallet => wallet.name);
  
    const answerDelete = await inquirer.prompt([
      {
        type: 'list',
        name: 'walletName',
        message: 'Choose a wallet to delete:',
        choices: walletNames,
      },
      {
        type: 'confirm',
        name: 'confirmDelete',
        message: 'Are you sure you want to delete this wallet?',
        default: false,
      },
    ]);
  
    if (answerDelete.confirmDelete) {
      const updatedWallets = wallets.filter(wallet => wallet.name !== answerDelete.walletName);
      writeWalletsFile(updatedWallets);
      console.log('Wallet deleted successfully!');
    } else {
      console.log('Wallet deletion canceled.');
    }
  
    await wait(2000);
  };
const renameWallet = async () => {
    const { wallets } = readWalletsFile();
  
    if (wallets.length === 0) {
      console.log('No wallets found.');
      await wait(2000)
      return;
    }
  
    const walletNames = wallets.map(wallet => wallet.name);
  
    const answerRename = await inquirer.prompt([
      {
        type: 'list',
        name: 'walletName',
        message: 'Choose a wallet to rename:',
        choices: walletNames,
      },
      {
        type: 'input',
        name: 'newName',
        message: 'Enter the new name for the wallet:',
        validate: (inputName) => {
          if (!inputName.trim()) {
            return 'Please enter a valid name for the wallet.';
          }
          return true;
        },
      },
    ]);
  
    const updatedWallets = wallets.map(wallet => {
      if (wallet.name === answerRename.walletName) {
        return { ...wallet, name: answerRename.newName };
      }
      return wallet;
    });
  
    writeWalletsFile(updatedWallets);
    console.log('Wallet renamed successfully!');
    await wait(2000);
  };
  const displayWalletsWithBalances = async () => {
    const { wallets } = readWalletsFile();
  
    if (wallets.length === 0) {
      console.log('No wallets found.');
    } else {
      console.log('Wallet names and balances:');
      for (const wallet of wallets) {
        const mainIndicator = wallet.main === 1 ? ' (Main)' : '';
        const balance = await getWalletBalance(wallet.publicKey);
        console.log(`${wallet.name}${mainIndicator}: ${balance} Sol`);
      }
    }
    await wait(5000)
  };
  
  const getWalletBalance = async (publicKey) => {
    try {
        const privateKeyBuffer = Uint8Array.from(bs58.decode(publicKey));
        const publicKeyY = new PublicKey(privateKeyBuffer);
      const balance = await connection.getBalance(publicKeyY);
      return balance / 1_000_000_000; // Convert balance from lamports to Sol
    } catch (error) {
      console.error(`Error fetching balance for wallet with public key ${publicKeyy}:`,
    error.message);
      return 'N/A';
    }
  };
  const getWalletBalanceInLamports = async (publicKey) => {
    try {
        const privateKeyBuffer = Uint8Array.from(bs58.decode(publicKey));
        const publicKeyY = new PublicKey(privateKeyBuffer);
      const balance = await connection.getBalance(publicKeyY);
      return balance; // Convert balance from lamports to Sol
    } catch (error) {
      console.error(`Error fetching balance for wallet with public key ${publicKeyy}:`,
    error.message);
      return 'N/A';
    }
  };
// Function to write the updated content to the JSON file
const writeWalletsFile = (wallets) => {
    const updatedContent = JSON.stringify({ wallets }, null, 2);
    fs.writeFileSync(walletFilePath, updatedContent, 'utf8');
  };
const addWallet = (name, publicKey, privateKey, main) => {
    const { wallets } = readWalletsFile();
    const updatedWallets = [...wallets, { name, publicKey, privateKey, main }];
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
    const isMain = readWalletsFile().wallets.length === 0 ? 1 : 0;
    addWallet(name, newWallet.publicKey.toBase58(), uint8ArrayToPublicKey(newWallet.secretKey), isMain);
  
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
          choices: ['Manage Solana Wallets', 'Distribute Solana', 'Transfer Between Two Wallets', 'Collect All Solana To Main Wallet', 'Exit'],
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
                if(numberOfWalletsAnswer.numberOfWallets == 1){
                    const walletName = `${baseWalletNameAnswer.baseWalletName}`;
                    createNewWallet(walletName);
                    await wait(2000); 

                }else{
                    const walletName = `${baseWalletNameAnswer.baseWalletName}${i + 1}`;
                    createNewWallet(walletName);
                  
                    await wait(2000); // Adjust the delay as needed
                }
                  
              }
              clearConsole();
              break;
  
              case 'View my wallets':
                const answerView = await inquirer.prompt([
                  {
                    type: 'list',
                    name: 'action',
                    message: 'Choose an action:',
                    choices: ['Rename a wallet', 'Delete a wallet', 'Set main wallet', 'View wallets balances', 'Back'],
                  },
                ]);
              
                switch (answerView.action) {
                  case 'Rename a wallet':
                    await renameWallet();
                    clearConsole();
                    break;
                  case 'Back':
                    break;
                  case 'Delete a wallet':
                    await deleteWallet();
                    clearConsole();
                    break;
                  case 'Set main wallet':
                    await setMainWallet();
                    clearConsole();
                    break;
                  case 'View wallets balances':
                    await displayWalletsWithBalances();
                    clearConsole();
                    break; // Add the break statement here
                  default:
                    await wait(5000);
                    clearConsole();
                    break;
                }
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
      
        case 'Distribute Solana':
            try {
                const answerDistribute = await inquirer.prompt([
                  {
                    type: 'input',
                    name: 'solanaAmount',
                    message: 'Enter the amount of Solana to distribute:',
                    validate: (input) => {
                      const amount = parseFloat(input);
                      return !isNaN(amount) && amount > 0 ? true : 'Please enter a valid amount greater than 0.';
                    },
                  },
                ]);
      
                await distributeSolana(answerDistribute.solanaAmount);
                console.log('Press enter to continue...');
                await wait(2000); // Adjust the delay as needed
              } catch (error) {
                console.error('Error during Solana distribution:', error.message);
                console.log('Press enter to continue...');
                await wait(2000); // Adjust the delay as needed
              }
      
              clearConsole();
              break;
        case 'Transfer Between Two Wallets':
                try {
                    const { wallets } = readWalletsFile();
                    const walletNames = wallets.map(wallet => wallet.name);
            
                    const answerTransfer = await inquirer.prompt([
                        {
                            type: 'list',
                            name: 'sender',
                            message: 'Choose the sender wallet:',
                            choices: walletNames,
                        },
                    ]);
            
                    const answerTransferAmount = await inquirer.prompt([
                        {
                            type: 'list',
                            name: 'receiver',
                            message: 'Choose the receiver wallet:',
                            choices: walletNames.filter(name => name !== answerTransfer.sender),
                        },
                        {
                            type: 'input',
                            name: 'solanaAmount',
                            message: 'Enter the amount of Solana to transfer:',
                            validate: (input) => {
                                const amount = parseFloat(input);
                                return !isNaN(amount) && amount > 0 ? true : 'Please enter a valid amount greater than 0.';
                            },
                        },
                    ]);
            
                    const senderWallet = wallets.find(wallet => wallet.name === answerTransfer.sender);
                    const receiverWallet = wallets.find(wallet => wallet.name === answerTransferAmount.receiver);
            
                    if (senderWallet && receiverWallet) {
                        console.log(`Transferring ${answerTransferAmount.solanaAmount} Solana from ${senderWallet.name} to ${receiverWallet.name}`);
                        await distributeSolanaToWallet(senderWallet.privateKey, receiverWallet.publicKey, answerTransferAmount.solanaAmount);
                        console.log('Transfer successful!');
                        console.log('Press enter to continue...');
                        await wait(2000);
                    } else {
                        console.error('Invalid sender or receiver wallet. Check if the wallet names are correct.');
                        console.log('Sender:', answerTransfer.sender);
                        console.log('Receiver:', answerTransferAmount.receiver);
                        console.log('Wallets:', readWalletsFile().wallets);
                        console.log('Press enter to continue...');
                        await wait(2000);
                    }
                } catch (error) {
                    console.error('Error during Solana transfer:', error.message);
                    console.log('Press enter to continue...');
                    await wait(2000);
                }
                clearConsole();
                break;
            
                case 'Collect All Solana To Main Wallet':
                    try {
                        const { wallets } = readWalletsFile();
                        const mainWallet = wallets.find(wallet => wallet.main === 1);
                
                        if (!mainWallet) {
                            console.log('No main wallet found.');
                            await wait(2000);
                            clearConsole();
                            break;
                        }
                
                        const answerCollectAll = await inquirer.prompt([
                            {
                                type: 'confirm',
                                name: 'confirmCollectAll',
                                message: `Are you sure you want to collect all Solana to the main wallet (${mainWallet.name})?`,
                                default: false,
                            },
                        ]);
                
                        if (answerCollectAll.confirmCollectAll) {
                            for (const senderWallet of wallets.filter(wallet => wallet.main !== 1)) {
                                const solanaAmountToCollect = await getWalletBalanceInLamports(senderWallet.publicKey);
                                if (solanaAmountToCollect > 0) {
                                    console.log(`Transferring ${solanaAmountToCollect / 1_000_000_000} Solana from ${senderWallet.name} to ${mainWallet.name}`);
                                    await distributeSolanaToWallet(senderWallet.privateKey, mainWallet.publicKey, solanaAmountToCollect - 1000000);
                                    console.log('Transfer successful!');
                                }
                            }
                
                            console.log('Collection from all wallets to the main wallet is complete.');
                            console.log('Press enter to continue...');
                            await wait(2000);
                        } else {
                            console.log('Collection canceled.');
                            await wait(2000);
                        }
                    } catch (error) {
                        console.error('Error during Solana collection:', error.message);
                        console.log('Press enter to continue...');
                        await wait(2000);
                    }
                    clearConsole();
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
  
