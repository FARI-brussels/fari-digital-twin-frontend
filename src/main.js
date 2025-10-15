import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { vueKeycloak } from "@josempgon/vue-keycloak";

const app = createApp(App)
app.use(router)
    .use(vueKeycloak, {
        config: {
            url: 'https://keycloak.digitaltwin.brussels/',
            realm: 'master',
            clientId: 'front',
        },
        initOptions: {
            onLoad: 'check-sso',
            flow: 'standard',
        }
    })
app.mount('#app')
