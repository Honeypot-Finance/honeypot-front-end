<template>
  <div>
    <MenuNavbar ref="menu"></MenuNavbar>

    <v-app-bar id="navbar" color="transparent" absolute class="isolate">
      <!-- desktop -->
      <nuxt-link class="deletemobile" :to="localePath('/swap')">
        <img src="~/assets/sources/logos/logo.svg" alt="logo" style="--w: clamp(10em, 13vw, 13.414375em)">
      </nuxt-link>
      <!-- mobile -->
      <nuxt-link class="showmobile" :to="localePath('/swap')">
        <img src="~/assets/sources/logos/logo-mobile.svg" alt="logo" style="--w: 40px">
      </nuxt-link>

      <!-- desktop -->
      <aside class="middle tcap deletemobile align-middle">
        <a v-for="(item, i) in dataNavbar" :key="i" :class="{ active: $route.path.includes(item.to) }" class="flex align-middle"
          @click="item.name !== 'portfolio' ? $router.push(localePath(item.to)) : ''">
          {{ item.name }}
        </a>
      </aside>

      <!-- desktop -->
      <aside class="right deletemobile" :class="isLogged ? 'font2' : 'font1'">
        <v-btn class="btn2">
          <img src="~/assets/sources/logos/honeypot.svg" alt="token" class="aspect" style="--w: 1.533125em">
          <span>{{ $wallet.currentNetwork && $wallet.currentNetwork.balance.toFormat(3) }}</span>
        </v-btn>

        <!-- connect button -->
        <v-menu bottom offset-y nudge-bottom="10px">
          <template #activator="{ on, attrs }">
            <v-btn class="btn2" v-bind="isLogged ? attrs : ''" v-on="isLogged ? on : ''"
              @click="!isLogged ? $store.dispatch('modalConnect') : ''">
              <template v-if="$wallet.isConnect">
                <span>{{ $wallet.accountShort }}</span>
                <v-icon>mdi-chevron-down</v-icon>
              </template>

              <template v-else>Connect wallet</template>
            </v-btn>
          </template>

          <v-list class="font2" color="var(--secondary)" style="--c:#fff">
            <v-list-item-group active-class="activeClass">
              <v-list-item v-for="(item, i) in dataMenuLogin" :key="i"
                @click="item.key === 'logout' ? $store.commit('signOut') : $router.push(localePath(key))">
                <v-list-item-title>{{ item.name }}</v-list-item-title>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-menu>
        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn class="btn2" v-bind="attrs" v-on="on">
              {{ $wallet.currentNetwork.label }}
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="$wallet.switchToNetwork(item.chainId)" v-for="(item, index) in $wallet.networks " :key="index">
              <v-list-item-title>{{ item.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </aside>

      <!-- mobile -->
      <v-btn icon class="showmobile" @click="$refs.menu.drawer = true">
        <v-icon large>mdi-menu</v-icon>
      </v-btn>
    </v-app-bar>
  </div>
</template>

<script>
import computeds from '~/mixins/computeds'
import menuLogin from '~/mixins/menuLogin'

export default {
  name: "NavbarComponent",
  mixins: [computeds, menuLogin],
  data() {
    return {
      dataNavbar: process.env.CHAIN_ENV === 'test' ? [
        // {
        //   name: "portfolio",
        //   to: "/portfolio"
        // },
        {
          name: "swap",
          to: "/swap"
        },
        // {
        //   name: "farm",
        //   to: "/farm"
        // },
        {
          name: "faucet",
          to: "/faucet"
        },
        {
          name: "pools",
          to: "/pools"
        },
        // {
        //   name: "dreampad",
        //   to: "/dreampad"
        // },
        // {
        //   name: "xhpot",
        //   to: "/staking"
        // },
      ] : [
        // {
        //   name: "portfolio",
        //   to: "/portfolio"
        // },
        {
          name: "swap",
          to: "/swap"
        },
        // {
        //   name: "farm",
        //   to: "/farm"
        // },
        {
          name: "pools",
          to: "/pools"
        },
        // {
        //   name: "dreampad",
        //   to: "/dreampad"
        // },
        // {
        //   name: "xhpot",
        //   to: "/staking"
        // },
      ],
    };
  },
  // created() {
  //   const theme = localStorage.getItem("theme");
  //   if (theme) {
  //     setTimeout(() => {
  //       this.$store.commit("switchTheme", theme);
  //     }, 100);
  //   }
  //   if (theme === "light") {this.themeButton = true}
  //   else {this.themeButton = false}
  // },
  methods: {
    // changeTheme(theme) {
    //   this.$store.commit("switchTheme", theme);
    //   this.themeButton = !this.themeButton;
    // },
  },
};
</script>

<style src="~/assets/styles/components/navbar.scss" lang="scss" />
