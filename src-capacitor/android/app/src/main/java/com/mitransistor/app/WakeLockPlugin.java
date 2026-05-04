package com.mitransistor.app;

import android.content.Context;
import android.os.PowerManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WakeLock")
public class WakeLockPlugin extends Plugin {
    private PowerManager.WakeLock wakeLock;

    @PluginMethod
    public void acquire(PluginCall call) {
        if (wakeLock == null) {
            PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MiTransistor::AudioWakeLock");
        }
        if (!wakeLock.isHeld()) {
            wakeLock.acquire(10 * 60 * 60 * 1000L);
        }
        call.resolve();
    }

    @PluginMethod
    public void release(PluginCall call) {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        call.resolve();
    }
}
