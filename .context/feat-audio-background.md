## Problema 2 — Audio que se apaga al bloquear la pantalla 🚧 EN PROGRESO

### Causa raíz

El elemento `<audio>` HTML5 en el WebView de Android no tiene permiso para seguir en background sin un foreground service activo. Android mata el proceso cuando se bloquea la pantalla.

### Intentos fallidos

#### Plugin `@capawesome-team/capacitor-media-session`

- Requiere licencia de pago (Capawesome Insiders) — da 404 en npm.

#### Plugin `@capgo/capacitor-media-session`

- Instala correctamente pero **crashea la app al tocar una emisora**.
- El crash es nativo (Java), no hay error en consola JS.
- Incompatible con Capacitor 7 en la práctica.

#### Plugin `@jofr/capacitor-media-session`

- Solo llega a versión 4.x para Capacitor 6 — misma incompatibilidad.
- Instala con `--legacy-peer-deps` pero también crashea.

#### `navigator.mediaSession` (Web API nativa)

- No crashea, funciona para mostrar metadatos.
- **No es suficiente para mantener el audio vivo** — Android mata el WebView igualmente al bloquear pantalla.
- `navigator.mediaSession` por sí solo no crea un foreground service.

#### Plugin `@mediagrid/capacitor-native-audio`

- Requiere Capacitor 8 — incompatible con el proyecto (Capacitor 7).

### Situación actual

Quasar oficialmente solo soporta hasta Capacitor 7, por lo que actualizar a Capacitor 8 no es una opción limpia.

### Solución en curso — WakeLock nativo en `MainActivity.java`

La aproximación es añadir un `PARTIAL_WAKE_LOCK` directamente en el código nativo Android, que mantiene el CPU activo (pero apaga la pantalla) — exactamente lo necesario para audio en background.

**`AndroidManifest.xml`** — permiso añadido:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

**`MainActivity.java`** — estado con WakeLock + plugin puente:

```java
package com.mitransistor.app;

import android.os.PowerManager;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private PowerManager.WakeLock wakeLock;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(WakeLockPlugin.class);
        super.onCreate(savedInstanceState);
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "MiTransistor::AudioWakeLock"
        );
    }

    public void acquireWakeLock() {
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(60 * 60 * 1000L); // máx 1 hora
        }
    }

    public void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }
}
```

**`WakeLockPlugin.java`** — nuevo archivo en `android/app/src/main/java/com/mitransistor/app/`:

```java
package com.mitransistor.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WakeLock")
public class WakeLockPlugin extends Plugin {

    @PluginMethod
    public void acquire(PluginCall call) {
        ((MainActivity) getActivity()).acquireWakeLock();
        call.resolve();
    }

    @PluginMethod
    public void release(PluginCall call) {
        ((MainActivity) getActivity()).releaseWakeLock();
        call.resolve();
    }
}
```

**`PlayerStation.vue`** — llamadas al WakeLock desde JS:

```javascript
import { registerPlugin } from '@capacitor/core'
const WakeLock = registerPlugin('WakeLock')

const acquireWakeLock = async () => {
  try {
    await WakeLock.acquire()
  } catch (e) {}
}

const releaseWakeLock = async () => {
  try {
    await WakeLock.release()
  } catch (e) {}
}
```

Y en el watcher de `isPlaying`:

```javascript
watch(
  () => playerStore.isPlaying,
  (playing) => {
    if (!audioEl.value) return
    if (playing) {
      audioEl.value.play().catch(() => {})
      updateMediaSession(playerStore.currentStation)
      acquireWakeLock()
    } else {
      audioEl.value.pause()
      clearMediaSession()
      releaseWakeLock()
    }
  },
)
```
