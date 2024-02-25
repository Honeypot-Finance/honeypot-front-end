<template>
  <div class="flex  justify-center">
    <div
      class="!flex-none p-[24px] w-[580.188px] h-[790.004px] justify-center items-start shrink-0 border-[color:var(--card-stroke,#F7931A)] [background:#121212] rounded-[54px] border-2 border-solid">

      <div class="text-white text-center [font-family:Inter] text-2xl font-bold leading-[30px]">Dreampad</div>
      <div class="mt-[15px] text-[rgba(255,255,255,0.56)] text-center [font-family:Inter] text-base font-normal leading-6 underline">Launch your token</div>
      <v-form id="container-liquidity" ref="form-pool" class="flex flex-col mt-[24px] gap-[22px]" @submit.prevent="addLiquiidty()">
        <div>
          <div class="text-[#77767A] [font-family:DM_Sans] text-base font-bold leading-3 tracking-[0.16px]">Token Address</div>
          <v-text-field v-model="form.tokenName" solo hide-spin-buttons
            class="!mt-[18px] flex h-[65px] items-center gap-4 [background:#18181B] pl-3 pr-4 py-3 rounded-2xl" @keyup="$event => $event.key === 'Enter' ? addLiquiidty() : ''">
          </v-text-field>
        </div>
        <div>
          <div class="text-[#77767A] [font-family:DM_Sans] text-base font-bold leading-3 tracking-[0.16px]">Token Symbol</div>
          <v-text-field v-model="form.tokenName" solo hide-spin-buttons
            class="!mt-[18px] flex h-[65px] items-center gap-4 [background:#18181B] pl-3 pr-4 py-3 rounded-2xl" @keyup="$event => $event.key === 'Enter' ? addLiquiidty() : ''">
          </v-text-field>
        </div>
        <div>
          <div class="text-[#77767A] [font-family:DM_Sans] text-base font-bold leading-3 tracking-[0.16px]">Token Name</div>
          <v-text-field v-model="form.tokenName" solo hide-spin-buttons
            class="!mt-[18px] flex h-[65px] items-center gap-4 [background:#18181B] pl-3 pr-4 py-3 rounded-2xl" @keyup="$event => $event.key === 'Enter' ? addLiquiidty() : ''">
          </v-text-field>
        </div>
        <div>
          <div class="text-[#77767A] [font-family:DM_Sans] text-base font-bold leading-3 tracking-[0.16px]">Token Amount</div>
          <v-text-field v-model="form.tokenName" solo hide-spin-buttons
            class="!mt-[18px] flex h-[65px] items-center gap-4 [background:#18181B] pl-3 pr-4 py-3 rounded-2xl" @keyup="$event => $event.key === 'Enter' ? addLiquiidty() : ''">
          </v-text-field>
        </div>
        <div>
          <div class="text-[#77767A] [font-family:DM_Sans] text-base font-bold leading-3 tracking-[0.16px]">Campaign Duration</div>
          <v-text-field v-model="form.tokenName" solo hide-spin-buttons
            class="!mt-[18px] flex h-[65px] items-center gap-4 [background:#18181B] pl-3 pr-4 py-3 rounded-2xl" @keyup="$event => $event.key === 'Enter' ? addLiquiidty() : ''">
          </v-text-field>
        </div>
        <div>
          <div class="text-[#77767A] [font-family:DM_Sans] text-base font-bold leading-3 tracking-[0.16px]">Pool Handler</div>
          <v-text-field v-model="form.tokenName" solo hide-spin-buttons
            class="!mt-[18px] flex h-[65px] items-center gap-4 [background:#18181B] pl-3 pr-4 py-3 rounded-2xl" @keyup="$event => $event.key === 'Enter' ? addLiquiidty() : ''">
          </v-text-field>
        </div>

        <v-btn :loading="approveLoading" @click="approve"
          class=" !h-[60px]  !max-h-none flex justify-center items-center gap-2.5 ![background:linear-gradient(180deg,rgba(232,211,124,0.13)_33.67%,#FCD729_132.5%),var(--card-stroke,#F7931A)] px-6 py-3 rounded-2xl border-4 border-solid !border-[rgba(247,147,26,0.37)]">
          <span class="!text-[color:var(--black,#000)]  [font-family:DM_Sans] text-[21px] font-bold leading-4">Approve</span>
        </v-btn>
      </v-form>

    </div>
  </div>
</template>

<script>
import computeds from '~/mixins/computeds'
import isMobile from '~/mixins/isMobile'

export default {
  name: "DreamPad",
  mixins: [computeds, isMobile],
  data() {
    return {
      approveLoading: false,
      form: {
        tokenName: '',
        tokenSymbol: '',
        tokenAmount: '',
        campaignDuration: '',
        poolHandler: ''
      }
    }
  },
  head() {
    const title = 'Farm';
    return {
      title,
    }
  },
  methods: {
    approve() {
      this.approveLoading = true
      this.$wallet.currentNetwork.contracts.factory.launchToken(this.form)
    }
  }
};
</script>

<!-- <style src="~/assets/styles/pages/farm.scss" lang="scss" /> -->
