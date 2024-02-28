<template>
  <div id="swap">
    <ModalsSwap ref="modal"></ModalsSwap>
    <ModalsTokens :tokens="$liquidity.pairsTokens" ref="fromTokens" @select="onFromSelect" :token="$swap.fromToken" :oppositeToken="$swap.toToken" @switch="$swap.switchTokens()" ></ModalsTokens>
    <ModalsTokens :tokens="$liquidity.pairsTokens" ref="toTokens" @select="(token) => {
      $swap.toToken = token
    }" :token="$swap.toToken" @switch="$swap.switchTokens()"  :oppositeToken="$swap.fromToken" ></ModalsTokens>

    <section id="swap-header" class="divcol center">
      <h1>Swap</h1>
      <h2>Swap tokens instantly</h2>
    </section>

    <section id="swap-content" class="fwrap center">
      <!-- left -->
      <v-card ref="target_swap_chart" class="left card">
        <ChartsSwapChart ref="chart" :height="heightChart" @model="$refs.modal.modalChart = true"></ChartsSwapChart>
      </v-card>

      <section>
      <!-- middle -->
      <v-form v-if="!$liquidity.liquidityLoading" ref="form-swap" class="divcol jspace !w-[100%]" style="gap: 12px" @submit.prevent="swap()">
        <div class="fnowrap space" style="gap: inherit">
          <!-- card swap left -->
          <aside id="swapFrom" class="target_drag divcol" style="gap: inherit"
            @dragover="($event) => $event.preventDefault()" @drop="dropToken($event)">
            <div class="container-options">
              <label>From</label>
              <div class="space">
                <v-chip close close-icon="mdi-chevron-down" class="btn2" @click="$refs.fromTokens.openModalTokens($swap.fromToken)"
                  @click:close="$refs.fromTokens.openModalTokens($swap.fromToken)">
                  <v-img :src="$swap.fromToken.logoURI" :alt="`${$swap.fromToken.name} token`" style="--w: 20px; --of: cover" class="aspect mr-2">
                    <template #placeholder>
                      <v-skeleton-loader type="avatar" />
                    </template>
                  </v-img>
                  <span>{{ $swap.fromToken.name }}</span>
                </v-chip>

                <div class="center" style="gap: 10px">
                  <v-btn @click="halfAmount" class="btn2">
                    <span>half</span>
                  </v-btn>
                  <v-btn @click="maxAmount" class="btn2">
                    <span>max</span>
                  </v-btn>
                </div>
              </div>
            </div>

            <v-card class="card">
              <div class="divcol">
                <v-text-field :rules="[this.$rules.max($swap.fromToken.balance)]" :disabled="!$swap.currentPair" v-model="$swap.fromAmount"   hide-spin-buttons solo placeholder="0.00" type="number" class="custome"
               @keyup="$event => $event.key === 'Enter' ? swap() : ''">
                  <!-- <template #counter>
                    <label class="font1" style="--fs: 21px">~${{ ($swap.fromAmount / 2).formatter(true) || 0 }} USD</label>
                  </template> -->
                </v-text-field>
              </div>
              <label class="font1">Balance {{ $swap.fromToken.balance.toFormat(2) }}</label>
            </v-card>
          </aside>

          <center>
            <v-btn icon style="--p: 7px" @click="$swap.switchTokens()">
              <img src="~/assets/sources/icons/swap-arrow.svg" alt="switch icon" style="--w: 16px">
            </v-btn>
          </center>

          <!-- card swap right -->
          <aside id="swapTo" class="target_drag divcol" style="gap: inherit"
            @dragover="($event) => $event.preventDefault()" @drop="dropToken($event)">
            <div class="container-options">
              <label>To</label>
              <div class="space">
                <v-chip close close-icon="mdi-chevron-down" class="tup btn2" @click="$refs.toTokens.openModalTokens($swap.toToken)"
                  @click:close="$refs.toTokens.openModalTokens($swap.toToken)">
                  <v-img :src="$swap.toToken.logoURI" :alt="`${$swap.toToken.name} token`" class="aspect mr-2" style="--w: 20px">
                    <template #placeholder>
                      <v-skeleton-loader type="avatar" />
                    </template>
                  </v-img>
                  <span>{{ $swap.toToken.name }}</span>
                </v-chip>
                <v-btn class="btn2" @click.stop="$refs.modal.modalSettings = true">
                  <img src="~/assets/sources/icons/settings.svg" alt="settings" style="--w: 18px">
                </v-btn>
              </div>
            </div>

            <v-card class="card">
              <div class="divcol">
                <v-text-field v-model="$swap.toAmount" solo  placeholder="0.00" type="number" class="custome"  hide-spin-buttons
                  disabled>
                  <!-- <template #counter>
                    <label class="font1" style="--fs: 21px">~${{ ($swap.toAmount / 2).formatter(true) || 0 }} USD</label>
                  </template> -->
                </v-text-field>
              </div>
              <label class="font1">Balance {{ $swap.toToken.balance.toFormat(2) }}</label>
            </v-card>
          </aside>
        </div>
        <div v-show="!$swap.currentPair" class="text-[#ca8a04]">
          There are no pairs for this token, please create liquidity pool first.
        </div>
        <v-btn class="btn stylish" :disabled="!($swap.fromAmount && $swap.toAmount)" @click="swap()">swap</v-btn>
      </v-form>
      <v-skeleton-loader
      v-else
      class="w-[100%]"
      type="card"
    ></v-skeleton-loader>
    </section>


      <!-- right -->
      <v-card class="right card divcol" style="max-width: 318px !important; gap: 14px 0">
        <div class="divcol center" style="gap: 6px">
          <h3 class="p" style="--fw: 700">Trending Coins</h3>
          <label>Drag your token to swap</label>
        </div>

        <div class="grid" style="gap: inherit" @dragstart="dragstart($event)" @dragend="dragend($event)">
          <div v-for="(item, i) in dataTokens.slice(0,6)" :key="i" class="divcol center">
            <v-img class="aspect !w-[50px] !h-[50px]">
              <template #default>
                <img v-show="item.logoURI" :src="item.logoURI" :alt="`${item.name} token`" class="!w-[50px] !h-[50px]" style="--of: cover">
              </template>
              <template #placeholder>
                <v-skeleton-loader type="avatar" />
              </template>
            </v-img>
            <label class="tup">{{ item.name }}</label>
          </div>
        </div>
      </v-card>
    </section>
  </div>
</template>

<script>
import computeds from '~/mixins/computeds'
// import {walletConnect} from '~/services/wallet-connect'
// import isMobile from '~/mixins/isMobile'
import { liquidity } from '../services/liquidity';
export default {
  name: "SwapPage",
  mixins: [computeds],
  data() {
    return {
      // walletConnect,
      heightChart: undefined,
      // swapFrom: {
      //   img: require('~/assets/sources/tokens/database.svg'),
      //   name: "bear",
      //   amount: undefined,
      // },
      // swapTo: {
      //   img: require('~/assets/sources/tokens/btc.svg'),
      //   name: "btc",
      //   amount: undefined,
      // },
      // dataTokens: [
      //   {
      //     img: require('~/assets/sources/tokens/hny.svg'),
      //     name: "hny",
      //   },
      //   {
      //     img: require('~/assets/sources/tokens/usdc.svg'),
      //     name: "usdc",
      //   },
      //   {
      //     img: require('~/assets/sources/tokens/btc.svg'),
      //     name: "btc",
      //   },
      //   {
      //     img: require('~/assets/sources/tokens/database.svg'),
      //     name: "coin name",
      //   },
      //   {
      //     img: require('~/assets/sources/tokens/database.svg'),
      //     name: "coin name",
      //   },
      // ],
      currentDrag: undefined,
    }
  },
  head() {
    const title = 'Swap';
    return {
      title,
    }
  },
  // computed: {
  //   observerTokensFrom() {
  //     return this.swapFrom.name
  //   },
  // },
  // watch: {
  //   observerTokensFrom(current, old) {
  //     if (current !== old) {
  //       // height cards
  //       const
  //         page = document.querySelector("#swap"),
  //         cardLeft = page.querySelector("aside#swapFrom");
  //       setTimeout(() => page.style.setProperty("--h-cards", `${cardLeft.getBoundingClientRect().height}px`), 100);
  //     }
  //   },
  // },
  computed: {
    dataTokens () {
      return this.$liquidity.pairsTokens
    }
  },
  mounted() {
    this.styles()
    window.addEventListener("resize", this.styles)
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.styles)
  },

  methods: {
    halfAmount () {
      this.$swap.fromAmount = this.$swap.fromToken.balance.div(2).toFixed(2)
    },
    maxAmount () {
      this.$swap.fromAmount = this.$swap.fromToken.balance.toFixed(2)
    },
    onFromSelect(token) {
      this.$swap.fromToken = token
    },
    styles() {
      // height chart calculator
      const
        container = this.$refs.target_swap_chart.$el,
        header = container.querySelector(".charts-header"),
        footer = container.querySelector(".charts-footer");
      this.heightChart = `
        ${container.getBoundingClientRect().height -
        (header.getBoundingClientRect().height + footer.getBoundingClientRect().height + 48 + 15)}px
      `
    },
    dragstart(event) {
      if (event.target?.alt) {
        document.querySelector(".v-form.middle").classList.add("focus");
        this.currentDrag = event.target
      }
    },
    dragend(event) {
      if (event.target?.alt) {
        document.querySelector(".v-form.middle").classList.remove("focus");
      }
    },
    dropToken(event) {
      const
        data = [this.swapFrom, this.swapTo],
        token = this[event.path.find(e => e.className.includes("target_drag")).id],
        [otherToken] = data.filter(el => el.name !== token.name && el.img !== token.img);

      if (otherToken?.name === this.currentDrag?.alt?.split(" token")[0]) { this.$swap.switchTokens() }
      else {
        token.img = this.currentDrag.src
        token.name = this.currentDrag.alt.split("token")[0]
      }
    },
    calcPriceTo(event) {

    },
    swap() {
      const validated = this.$refs['form-swap'].validate()
      if (!validated) {
         return
      }
      if (!(this.$swap.fromAmount && this.$swap.toAmount)) return;
      const data = {
        tokenFrom: this.$swap.fromToken.name,
        priceFrom: this.$swap.fromAmount,
        tokenTo:  this.$swap.toToken.name,
        priceTo: this.$swap.toAmount,
      }

      this.$store.commit("setSwapReview", data)
      this.$router.push(this.localePath('/swap-review'))
    }
  }
};
</script>

<style src="~/assets/styles/pages/swap.scss" lang="scss" />
