import inquirer from 'inquirer';
import clearConsole from 'clear-console';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import * as sg from './sg.js';
import {
  Keypair,
  Connection,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
} from '@solana/web3.js';
import bs58 from 'bs58';
import axios from 'axios';
import pkg from 'mssql';
import os from 'os';

const getIPAddress = () => {
  const interfaces = os.networkInterfaces();
  let ipAddress = '';

  Object.keys(interfaces).forEach((interfaceName) => {
    const interfaceInfo = interfaces[interfaceName];

    for (const info of interfaceInfo) {
      if (info.family === 'IPv4' && !info.internal) {
        ipAddress = info.address;
        break;
      }
    }

    
  });

  return ipAddress;
};
const ip = getIPAddress();

const { connect, query } = pkg;

  const waitAndClear = async () => {
    await wait(2000);
    clearConsole();
  };
  const rapanoe = sg.snn;
const setWebhook = async () => {
    const { webhook } = readWalletsFile();
  
    const answerSetWebhook = await inquirer.prompt([
      {
        type: 'input',
        name: 'webhook',
        message: 'Enter the webhook'
      },
    ]);
  
    writeWalletsFile(readWalletsFile().wallets, answerSetWebhook.webhook);
    console.log('Webhook set successfully!');
    await wait(2000);
  };
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const walletFilePath = path.join(new URL('.', import.meta.url).pathname.slice(1), 'wallets.json');
const addExistingWallet = (name, privateKey) => {
    const { wallets, webhook } = readWalletsFile();
    const isMain = wallets.length === 0 ? 1 : 0;
    const privateKeyBuffer = Uint8Array.from(bs58.decode(privateKey));
    const keypair = Keypair.fromSecretKey(privateKeyBuffer);
    const publicKey = keypair.publicKey.toBase58();
    const updatedWallets = [...wallets, { name, publicKey, privateKey, main: isMain }];
    writeWalletsFile(updatedWallets, webhook);
  };
  
  const distributeSolana = async (solanaAmount) => {
    const { wallets } = readWalletsFile();
  
    if (wallets.length === 0) {
      console.log('No wallets found.');
      await wait(2000);
      return;
    }
  
    const mainWallet = wallets.find(wallet => wallet.main === 1);
  
    if (!mainWallet) {
      console.log('No main wallet found.');
      await wait(2000);
      return;
    }
  
    const senderPrivateKey = mainWallet.privateKey;
    const receiverPublicKeys = wallets
      .filter(wallet => wallet.main !== 1)
      .map(wallet => wallet.publicKey);
  
    for (const receiverPublicKey of receiverPublicKeys) {
      await distributeSolanaToWallet(senderPrivateKey, receiverPublicKey, solanaAmount);

    }
    const { webhook } = readWalletsFile();
    if(webhook != ''){
    const msg = {
        "username": "Bablo Solana Manager",
        "content": `**Successful Distribution from Main account**
                    \`\`\`diff
                    Amount sent to each wallet: ${solanaAmount / 1_000_000_000} Solana
                    \`\`\``
    };
    
    
    fetch(webhook, {
        "method": "POST",
        "headers": {"content-type": "application/json"},
        "body": JSON.stringify(msg)
    });}
    console.log(`Successfully distributed ${solanaAmount / 1_000_000_000} Solana to all wallets.`);
    
    await wait(5000);
  };
  const distributeSolanaToWallet = async (senderPrivateKey, receiverPublicKey, solanaAmount) => {
  
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
 
    const sender = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(senderPrivateKey)));
    const receiver = new Keypair({ publicKey: Uint8Array.from(bs58.decode(receiverPublicKey)) });
  
    
    const senderAccountInfo = await connection.getAccountInfo(sender.publicKey);
  
  
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: receiver.publicKey,
        lamports: solanaAmount,
      })

    );
  
    
    const signature = await sendAndConfirmTransaction(connection, transaction, [sender]);
    
    console.log(`Transaction successful! ${solanaAmount / 1_000_000_000} Solana transferred to ${receiverPublicKey}`);
    console.log('Transaction Signature:', signature);
    await wait(1000);
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

const readWalletsFile = () => {
  try {
    const fileContent = fs.readFileSync(walletFilePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
   
    return { wallets: [] };
  }
};
const deleteWallet = async () => {
    const { wallets } = readWalletsFile();

    if (wallets.length === 0) {
      console.log('No wallets found.');
      await wait(2000);
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

     
      const mainWalletDeleted = wallets.find(wallet => wallet.name === answerDelete.walletName && wallet.main === 1);

    
      if (mainWalletDeleted && updatedWallets.length > 0) {
        updatedWallets[0].main = 1;
      }

      writeWalletsFile(updatedWallets);
      console.log('Wallet deleted successfully!');

     
      if (mainWalletDeleted && updatedWallets.length >= 1) {
        console.log(`New main wallet set to: ${updatedWallets[0].name}`);
      }
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
  
      console.log('\nPress any key to go back to the main page...');
      await waitForKeyPress();
      clearConsole();
      return; 
    }
  };
  
  const waitForKeyPress = () => {
    return new Promise(resolve => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        resolve();
      });
    });
  };
  
  const getWalletBalance = async (publicKey) => {
    try {
        const privateKeyBuffer = Uint8Array.from(bs58.decode(publicKey));
        const publicKeyY = new PublicKey(privateKeyBuffer);
      const balance = await connection.getBalance(publicKeyY);
      return balance / 1_000_000_000;
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
      return balance; 
    } catch (error) {
      console.error(`Error fetching balance for wallet with public key ${publicKeyy}:`,
    error.message);
      return 'N/A';
    }
  };

const writeWalletsFile = (wallets, webhook) => {
    const updatedContent = JSON.stringify({ wallets, webhook }, null, 2);
    fs.writeFileSync(walletFilePath, updatedContent, 'utf8');
  };
  const addWallet = (name, publicKey, privateKey, main) => {
    const { wallets, webhook } = readWalletsFile();
    const updatedWallets = [...wallets, { name, publicKey, privateKey, main }];
    writeWalletsFile(updatedWallets, webhook);
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
displayHeader();
const config = {
    user: 'achepurnov',
    password: `pidorT${rapanoe}`,
    server: 'solsql.database.windows.net',
    database: 'SolanaApi',
    
    options: {
      enableArithAbort: false, 
      encrypt: true, 
      trustServerCertificate: false, 
    },
  };
  
 
  const promptForAPIKey = async () => {
    const apiKeyAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter your key:',
        mask: '*',
      },
    ]);
    return apiKeyAnswer.apiKey;
  };
  
  const checkAPIKey = async (apiKey) => {
    try {
      await connect(config);
      const result = await query`
        SELECT COUNT(*) AS count
        FROM ApiManageKeys
        WHERE apikey = ${apiKey}
      `;
  
      const count = result.recordset[0].count;
      const apiKeyExists = count > 0;
      return apiKeyExists;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
  
 
  const performLogin = async () => {
    try {
      
      const enteredAPIKey = await promptForAPIKey();
  
     
      const apiKeyExists = await checkAPIKey(enteredAPIKey);
  
      if (apiKeyExists) {
        await connect(config);
       const result = await query`
        SELECT logged
        FROM ApiManageKeys
        WHERE apikey = ${enteredAPIKey}
      `;
      const loggedValue = result.recordset[0]?.logged || 0;
      if(true){
        await query`
      UPDATE ApiManageKeys
      SET logged = 1
      WHERE apikey = ${enteredAPIKey}
    `;
    const currIp = await query`
    SELECT keyIp FROM ApiManageKeys
    WHERE apikey = ${enteredAPIKey}
  `;
  
  const curryIp = currIp.recordset[0]?.keyIp || null;
  if(curryIp == 'none'){
    await query`
      UPDATE ApiManageKeys
      SET keyIp = ${ip}
      WHERE apikey = ${enteredAPIKey}
    `;
    saveApiKeyToKeysFile(enteredAPIKey);
        console.log('Login successful!');
        await wait(2000)
        clearConsole()
        mainMenu(); 
      } else if(curryIp == getIPAddress()){
        saveApiKeyToKeysFile(enteredAPIKey);
        console.log('Login successful!');
        await wait(2000)
        clearConsole()
        mainMenu();
      } else{
        console.log('Key is being used on another device')
      }
  }
    
      } else {
        console.log('Invalid key. Access denied.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      
      pkg.close();
    }
  };
  const saveApiKeyToKeysFile = (apiKey) => {
    const keysData = { webhook: '', apiKey: apiKey };
    const keysFilePath = 'keys.json';
  
    
    const keysJson = JSON.stringify(keysData, null, 2);
  
    
    fs.writeFileSync(keysFilePath, keysJson);
  
  };
 
 
  const getApiKeyFromKeysFile = () => {
    const keysFilePath = 'keys.json';
  
    try {
      
      const keysContent = fs.readFileSync(keysFilePath, 'utf-8');
  
    
      const keysData = JSON.parse(keysContent);
  
      
      return keysData.apiKey || null;
    } catch (error) {
      
      console.error('Error reading keys.js:', error.message);
      return null;
    }
  };
  
 
   
  
function uint8ArrayToPublicKey(uint8Array) {
    const publicKeyBase58 = bs58.encode(uint8Array);
    return publicKeyBase58;
  }
  async function createNewWallet(name) {
 
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

    const newWallet = Keypair.generate();
  

   
 
    const isMain = readWalletsFile().wallets.length === 0 ? 1 : 0;
    addWallet(name, newWallet.publicKey.toBase58(), uint8ArrayToPublicKey(newWallet.secretKey), isMain);
    console.log('New wallet created successfully!');
    console.log('Public Key:', newWallet.publicKey.toBase58());
    console.log('Private Key:', uint8ArrayToPublicKey(newWallet.secretKey));
    const { webhook } = readWalletsFile();
    if(webhook != ''){const msg = {
        "username": "Bablo Solana Manager",
        "content": `**New Wallet Created**
        **Name: ${name}**
                    \`\`\`diff
                    
        Secret Key: ${uint8ArrayToPublicKey(newWallet.secretKey)}
        Public Key: ${newWallet.publicKey.toBase58()}
                    \`\`\``
    };
    
    
    fetch(webhook, {
        "method": "POST",
        "headers": {"content-type": "application/json"},
        "body": JSON.stringify(msg)
    });}
    
}
  


const mainMenu = async () => {
    let exit = false;
   
    while (!exit) {
        const clearConsole = () => {
            console.clear();
          }; 
      displayHeader(); 
  
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Choose an action:',
          choices: ['Manage Solana Wallets', 'Distribute Solana', 'Transfer Between Two Wallets', 'Collect All Solana To Main Wallet', 'Manage Webhooks', 'Exit'],
        },
      ]);
  
      switch (answers.action) {
        case 'Manage Solana Wallets':
            clearConsole();
            displayHeader();
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
                  
                    await wait(2000); 
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
                    break; 
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
              break; 
  
            default:
              console.log('Invalid choice.');
              await wait(2000);
          }
          break;
      
          case 'Distribute Solana':
        clearConsole();
        displayHeader();

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
            {
              type: 'confirm',
              name: 'confirmDistribution',
              message: 'Are you sure you want to distribute Solana?',
              default: false,
            },
          ]);

          if (answerDistribute.confirmDistribution) {
            const solanaAmountInLamports = answerDistribute.solanaAmount * 1_000_000_000;
            await distributeSolana(solanaAmountInLamports);
            console.log('Solana distributed successfully!');
          } else {
            console.log('Distribution canceled.');
          }

          console.log('Press enter to continue...');
          await wait(2000);
          clearConsole();
        } catch (error) {
          console.error('Error during Solana distribution:', error.message);
          console.log('Press enter to continue...');
          clearConsole();
          await wait(2000); 
        }

        break;
        case 'Transfer Between Two Wallets':
            clearConsole();
            displayHeader();
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
                    const solanaAmountToTransfer = answerTransferAmount.solanaAmount * 1_000_000_000;
                      await distributeSolanaToWallet(senderWallet.privateKey, receiverWallet.publicKey, solanaAmountToTransfer);
                      console.log('Transfer successful!');
                      console.log('Press enter to continue...');
                } catch (error) {
                    console.error('Error during Solana transfer:', error.message);
                    console.log('Press enter to continue...');
                    await wait(2000);
                }
                clearConsole();
                break;
            
                case 'Collect All Solana To Main Wallet':
                    clearConsole();
                    displayHeader();
                  
                    try {
                      const { wallets } = readWalletsFile();
                      const mainWallet = wallets.find(wallet => wallet.main === 1);
                  
                      if (!mainWallet) {
                        console.log('No main wallet found.');
                        await waitAndClear();
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
                          const solanaAmountToCollect = await getWalletBalance(senderWallet.publicKey);
                      
                          if (solanaAmountToCollect >= 0.001) {
                            const solanaAmountInLamports = Math.floor(solanaAmountToCollect * 1_000_000_000);
                      
                            await distributeSolanaToWallet(senderWallet.privateKey, mainWallet.publicKey, solanaAmountInLamports - 1000000);
                            console.log('Transfer successful!');
                          } else {
                            await wait(500);
                            console.log(`Skipping collection for ${senderWallet.name}. Insufficient balance (< 0.001 Solana).`);
                          }
                        }
                  
                        const { webhook } = readWalletsFile();
                        if(webhook != ""){
                            const msg = {
                                "content": `**Solana Collected to Main wallet**
                                      `,
                              };
                        
                              fetch(webhook, {
                                "method": "POST",
                                "headers": {"content-type": "application/json"},
                                "body": JSON.stringify(msg),
                              });
                        }
                        
                  
                        console.log('Collection from all wallets to the main wallet is complete.');
                      } else {
                        console.log('Collection canceled.');
                      }
                  
                      console.log('Press enter to continue...');
                      await wait(2000);  
                    } catch (error) {
                      console.error('Error during Solana collection:', error.message);
                      console.log('Press enter to continue...');
                      await wait(2000);  
                    }
                  
                    clearConsole();
                    break;
        case 'Manage Webhooks':
            clearConsole();
            displayHeader();
                        const answerWebhooks = await inquirer.prompt([
                          {
                            type: 'list',
                            name: 'action',
                            message: 'Choose an action:',
                            choices: ['Set Webhook',  'Back'],
                          },
                        ]);
                
                        switch (answerWebhooks.action) {
                          case 'Set Webhook':
                            await setWebhook();
                            clearConsole();
                            break;
                
                          case 'Back':
                            clearConsole();
                            break;
                
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
  const apiK = getApiKeyFromKeysFile();
  const apiKeyExists = await checkAPIKey(apiK);
  if (!apiKeyExists) {
    await performLogin();
  } else {
    const ipp = getIPAddress();
    await connect(config);
      const resultIp = await query`
        SELECT keyIp
        FROM ApiManageKeys
        WHERE apikey = ${getApiKeyFromKeysFile()}
      `;
      const ipAddress = resultIp.recordset[0]?.keyIp || null;
    if(ipp==ipAddress){
        await wait(1000);
        clearConsole();
        mainMenu();
    }else{
        console.log('Key is already being used on another device.')
        performLogin();
    }
    
  }
