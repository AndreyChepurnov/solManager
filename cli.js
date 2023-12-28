const inquirer = require('inquirer');
const clearConsole = require('clear-console');
const fs = require('fs');
const path = require('path');
const { Keypair, Connection, SystemProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');
const walletFilePath = path.join(__dirname, 'wallets.json');

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
  console.log('  _____     ____     _____         ____        __      _     ____          __    __       ____        __      _     ____        _____     _____   ______    ');
  console.log(' / ____\\   / __ \\   (_   _)       (    )      /  \\    / )   (    )         \\ \\  / /      (    )      /  \\    / )   (    )      / ___ \\   / ___/  (   __ \\   ');
  console.log('( (___    / /  \\ \\    | |         / /\\ \\     / /\\ \\  / /    / /\\ \\         () \\/ ()      / /\\ \\     / /\\ \\  / /    / /\\ \\     / /   \\_) ( (__     ) (__) )  ');
  console.log(' \\___ \\  ( ()  () )   | |        ( (__) )    ) ) ) ) ) )   ( (__) )        / _  _ \\     ( (__) )    ) ) ) ) ) )   ( (__) )   ( (  ____   ) __)   (    __/   ');
  console.log('     ) ) ( ()  () )   | |   __    )    (    ( ( ( ( ( (     )    (        / / \\/ \\ \\     )    (    ( ( ( ( ( (     )    (    ( ( (__  ) ( (       ) \\ \\  _  ');
  console.log(' ___/ /   \\ \\__/ /  __| |___) )  /  /\\  \\   / /  \\ \\/ /    /  /\\  \\      /_/      \\_\\   /  /\\  \\   / /  \\ \\/ /    /  /\\  \\    \\ \\__/ /   \\ \\___  ( ( \\ \\_)) ');
  console.log('/____/     \\____/   \\________/  /__(  )__\\ (_/    \\__/    /__(  )__\\    (/          \\) /__(  )__\\ (_/    \\__/    /__(  )__\\    \\____/     \\____\\  )_) \\__/  ')
  console.log('                                                                                                                                                                         ')
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
const mainMenu = async () => {
  let exit = false;

  while (!exit) {
    clearConsole(); // Clear the console before displaying a new menu
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
            choices: ['Create a new wallet', 'View my wallets', 'Back'],
          },
        ]);
        switch (answerManage.action) {
          case 'Create a new wallet':
            console.log('You chose to create a Solana wallet.');
            await wait(2000);

            const walletNameAnswer = await inquirer.prompt([
            {
                type: 'input',
                name: 'walletName',
                message: 'Enter a name for the new wallet:',
                validate: (input) => {
                    if (!input.trim()) {
                        return 'Please enter a valid name for the wallet.';
                    }
                    return true;
                },
            },]);
            createNewWallet(walletNameAnswer.walletName);
            console.log(`You created ${walletNameAnswer.walletName} wallet`);
            await wait(5000);
            break;
          case 'View my wallets':
            displayWalletNames();
            await wait(50000);

          
          case 'Back':
            break; // Will go back to the main menu
          default:
            console.log('Invalid choice.');
        }
        break;

      case 'Create Solana Wallet':
        
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
