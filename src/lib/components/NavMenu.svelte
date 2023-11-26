<script lang="ts">
	import { base } from "$app/paths";
	import { createEventDispatcher } from "svelte";
	import Logo from "$lib/components/icons/Logo.svelte";
	import { switchTheme } from "$lib/switchTheme";
	import { PUBLIC_ORIGIN } from "$env/static/public";
	import NavConversationItem from "./NavConversationItem.svelte";
	import { ethers } from 'ethers';
	import { onMount } from 'svelte';
	import { truncateAddress } from './helpers';
	import GPT_ABI from '../contracts/gpt.json';
  
	const dispatch = createEventDispatcher<{
	  shareConversation: { id: string; title: string };
	  clickSettings: void;
	}>();
  
	export let conversations: Array<{
	  id: string;
	  title: string;
	}> = [];
  
	let userAddress: string | null = null;
	let network: ethers.providers.Network | null = null;
	let balance: string | null = null;
	let isConnected = false;
  
	const GPT_CONTRACT_ADDRESS = "0xC3d2675aE844aB277536402c478031770071d9e4";

	/* Basic account setup */
	async function setup(accounts: string[]) {
	userAddress = accounts[0]; // update the state
	// Get and update the ethereum provider
	try {
		const provider = new ethers.providers.Web3Provider(window.ethereum);
		network = await provider.getNetwork();

		// Create a new instance of the Contract
		const gptContract = new ethers.Contract(GPT_CONTRACT_ADDRESS, GPT_ABI, provider);
		
		// Fetch the balance
		const rawBalance = await gptContract.balanceOf(userAddress);
		const gptBalance = ethers.utils.formatUnits(rawBalance, 18);

		balance = truncateBalance(gptBalance) + ' GPT';
		isConnected = true;
	} catch (e) {
		console.error(e);
	}
	}
  
	async function connectWallet() {
	  if (window.ethereum) {
		// ethereum is an object injected by the wallet. Let's check if it is available
		try {
		  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }); // use the request method to get the accounts, i.e., logging in to Metamask
		  if (accounts.length > 0) {
			await setup(accounts);
		  } else {
			alert('No Ethereum accounts found');
		  }
		} catch (e) {
		  console.error(e);
		}
	  } else {
		alert('No Ethereum Wallet found');
	  }
	}
  
	onMount(async () => {
	  if (window.ethereum) {
		try {
		  const accounts = await window.ethereum.request({ method: 'eth_accounts' }); // get the accounts
  
		  if (accounts.length > 0) {
			await setup(accounts);
		  }
		} catch (e) {
		  console.error(e);
		}
	  }
  
	  // Listen for Metamask account change event
	  window.ethereum?.on('accountsChanged', setup);
	});
  
	function truncateBalance(balance: string): string {
	  const MAX_DECIMALS = 4;
	  const [integerPart, decimalPart] = balance.split('.');
	  let truncatedBalance = integerPart;
  
	  if (decimalPart) {
		truncatedBalance += '.' + decimalPart.slice(0, MAX_DECIMALS);
	  }
	  return truncatedBalance;
	}
  </script>
  
  <div class="sticky top-0 flex flex-none items-center justify-between px-3 py-3 max-sm:pt-0">
	<a class="flex items-center rounded-xl text-lg font-semibold" href="{PUBLIC_ORIGIN}{base}/">
	  <Logo classNames="mr-1 text-3xl" />
	</a>
	<a
	  href={base || "/"}
	  class="flex rounded-lg border bg-white px-2 py-0.5 text-center shadow-sm hover:shadow-none dark:border-gray-100/0 dark:bg-gray-700/30 text-white"
	  >
		+ New Chat
	  </a>
	</div>
	<div
	  class="scrollbar-custom flex flex-col gap-1 overflow-y-auto rounded-r-xl bg-gradient-to-l from-gray-50 px-3 pb-3 pt-2 dark:from-gray-800/30"
	>
	  {#each conversations as conv (conv.id)}
		<NavConversationItem on:editConversationTitle on:deleteConversation {conv} />
	  {/each}
	</div>
	<div
	  class="mt-0.5 flex flex-col gap-1 rounded-r-xl bg-gradient-to-l from-gray-50 p-3 text-sm dark:from-gray-800/30"
	>
	  {#if isConnected}
		<p class="text-small text-gray-100" style="padding-left:14px; padding-top:14px;">
		  Wallet: <strong>{truncateAddress(userAddress)}</strong>
		</p>
		<ul class="text-small text-gray-100" style="padding-left:14px; padding-bottom:14px;">
		  <li>Network: {network.name}</li>
		  <li>Balance: {balance}</li>
		</ul>
	  {:else}
		<button
		  class="bg-gray-600 text-l text-gray-50 shadow-md rounded-md px-3 py-4 hover:bg-gray-700" style="display: flex; align-items: center;"
		  on:click={connectWallet}><img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" height="30px" width="30px" style="margin:0 10px 0 10px;"> Connect with Metamask </button>
	  {/if}
	
	  <button
		on:click={() => dispatch("clickSettings")}
		type="button"
		class="group flex h-9 flex-none items-center gap-1.5 rounded-lg pl-3 pr-2 text-gray-500 hover:bg-gradient-to-l from-gray-50 p-3 text-sm dark:from-gray-50/30 text-white"
	  >
		Settings
	  </button>
	  <a
		href="{base}/privacy"
		class="group flex h-9 flex-none items-center gap-1.5 rounded-lg pl-3 pr-2 text-gray-500 hover:bg-gradient-to-l from-gray-50 p-3 text-sm dark:from-gray-50/30 text-white"
	  >
		About & Privacy
	  </a>
	</div>