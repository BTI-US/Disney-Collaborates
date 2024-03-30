import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { base } from 'viem/chains';
import { reconnect, watchAccount, disconnect, getAccount } from '@wagmi/core';

// 1. Get a project ID at https://cloud.walletconnect.com
let projectId;

try {
  // Attempt to load the configuration file
  const config = require('../contract-config.json');

  // Extracting values from the config
  projectId = config.projectId;

  // Validate the required configuration values
  if (!projectId) {
    throw new Error("Required configuration value (projectId) is missing.");
  }

  // Use the projectId as needed
} catch (error) {
  // Check if the error is due to a missing file
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error("Error: Configuration file not found.");
    process.exit(1);
  }

  // Handle other errors
  console.error("Error loading configuration: ", error.message);
}

// 2. Create wagmiConfig
const metadata = {
  name: 'Lotso',
  description: 'Web3Modal for Lotso',
  url: 'https://lotso.org', // origin must match your domain & subdomain.
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [base];
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});
reconnect(config);
console.log("Wagmi Config is:" + config);

// 3. Create modal
const modal = createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true, // Optional - false as default
  themeVariables: {
    '--w3m-z-index': 999
  }
});

function connect(param = 'dark') {
  if (getAccount(config).isConnected) {
    disconnect(config);
  } else {
    modal.setThemeMode(param);
    modal.open();
  }
}

const connectBtn = document.getElementById('connectWallet');
const hint1 = document.getElementById('walletAddressHint1');
const hint2 = document.getElementById('walletAddressHint2');
const acceptBtn = document.getElementById('connectAccept');
const declineBtn = document.getElementById('connectDecline');
const connectTitle = document.getElementById('walletAddressTitle');
const airdrop = document.getElementById('airdrop');

if (acceptBtn) {
  acceptBtn.addEventListener('click', function() {
    // Get the responsive menu element
    var responsiveMenu = document.querySelector('.navbar-collapse');

    // Close the responsive menu if it's open
    if (responsiveMenu.classList.contains('show')) {
        responsiveMenu.classList.remove('show');
        responsiveMenu.setAttribute('aria-expanded', 'false');
    }

    // Get the data-param attribute and proceed with the connect function
    var param = this.getAttribute('data-param');
    connect(param);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

// listening for account changes
watchAccount(config,
  {
    onChange(account) {
      if (hint2) {
        let address = account.address ?? '';
        let truncatedAddress = address; // Adjust this if you want to show a truncated address

        let addressHtml = '<div class="address-container">';
        addressHtml += '<input id="address" type="text" value="' + escapeHtml(truncatedAddress) + '" readonly data-full-address="' + escapeHtml(address) + '">';
        addressHtml += '<button onclick="copyAddress(event)"><i class="fa fa-copy"></i></button>';
        addressHtml += '</div>';

        hint2.innerHTML = addressHtml;
      }
      if (acceptBtn) {
        if (account.isConnected) {
          hint1.innerText = 'Your wallet address is:';
          acceptBtn.innerText = 'Disconnect';
          connectBtn.innerText = 'Airdrop';
          connectTitle.innerText = 'Account Information';
          declineBtn.innerText = 'Close';
          airdrop.style.display = 'block';
        } else {
          hint1.innerHTML = 'To continue, please connect your Web3 wallet, such as <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask</a> or <a href="https://walletconnect.org/" target="_blank" rel="noopener noreferrer">WalletConnect</a>. This allows our website to securely interact with your wallet.';
          hint2.innerHTML = 'By clicking "Accept and Continue", you agree to our <a href="#" data-toggle="modal" data-target="#termsModal">terms and conditions</a> and <a href="#" data-toggle="modal" data-target="#privacyModal">privacy policy</a>. You will be prompted to connect your wallet via an external link. Ensure you\'re using a trusted and secure wallet service.';
          acceptBtn.innerText = 'Accept and Continue';
          connectBtn.innerText = 'Airdrop';
          connectTitle.innerText = 'Notes Before Connecting';
          declineBtn.innerText = 'Decline';
          airdrop.style.display = 'none';
        }
      }
    }
  }
);