<template>
  <div id="pools">
    <section id="pools-header" class="divcol" style="gap: 10px">
      <h1 class="tcap font1 text-center" style="gap: inherit">Faucet</h1>
      <p class="text-center">With testnet Faucet you can get free assets to test the  honeypot</p>
      <!--
      <v-card class="card space gap2">
        <div class="divcol" style="gap: 10px">
          <label>Total Value Locked
            <img src="~/assets/sources/icons/info.svg" alt="info icon" style="--w: .813125em">
          </label>
          <span>{{poolsLocked ? `$${poolsLocked.toLocaleString().split('.').join(',')}` : ''}}</span>
        </div>

        <img
          src="~/assets/sources/miscellaneous/locked-pools-test-img.jpg" alt="test image"
          style="--h: 123px; --ar: 1.75 / 1; border-radius: 0 !important"
        >
      </v-card> -->
    </section>

    <!-- need empty image here -->
    <v-data-table :headers="tableHeaders"  :items="$wallet.currentNetwork.tokens" hide-default-footer mobile-breakpoint="-1">
      <template #[`item.name`]="{ item }">
        <div class="acenter font2" style="gap: 10px">
          <v-sheet class="dual-tokens" color="transparent" style="--h-sheet: 40px">
            <img :src="item.logoURI" :alt="`${item.name} token`"
              class="aspect">
          </v-sheet>

          <span class="bold tup">{{ item.name }}</span>
        </div>
      </template>

      <template #[`item.balance`]="{ item }">
        {{ item.balance }}
      </template>
      <template #[`item.actions`]="{ item }">
        <v-btn class="btn"
          :loading="item.faucetLoading"
          @click="claimFaucet(item)">
          <span> Faucet </span>
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script>

export default {
  name: "FaucetPage",
  data() {
    console.log(this.$wallet.currentNetwork)
    return {
      tableHeaders: [
        { value: "name", text: "Asset", sortable: false },
        { value: "balance", text: "Balance", align: "start", sortable: false },
        { value: "actions", text: "Action", align: "start", sortable: false },
      ]
    }
  },
  head() {
    const title = 'Faucet';
    return {
      title,
    }
  },
  methods: {
    async claimFaucet(item) {
      item.faucetLoading = true
      try {
        const res =  await item.faucet()
        await item.getBalance()
        this.$alert("success", 'Transaction approved for ' + item.name, { persistent: true })
        //
      } catch (error) {
        console.error(error)
        this.$alert("cancel", "Wait at least 24 hours to claim again " + item.name + " faucet", { persistent: true })
      }
      item.faucetLoading = false
    }
  }
};
</script>

<style src="~/assets/styles/pages/pools.scss" lang="scss" />
