package com.mitransistor.app;

import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WakeLock")
public class WakeLockPlugin extends Plugin {

    @PluginMethod
    public void acquire(PluginCall call) {
        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        getContext().startForegroundService(intent);
        call.resolve();
    }

    @PluginMethod
    public void release(PluginCall call) {
        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        getContext().stopService(intent);
        call.resolve();
    }
}
