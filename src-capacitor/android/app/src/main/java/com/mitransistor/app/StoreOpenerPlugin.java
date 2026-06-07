package com.mitransistor.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StoreOpener")
public class StoreOpenerPlugin extends Plugin {

    private static final String PLAY_STORE_PACKAGE = "com.android.vending";

    @PluginMethod
    public void openPlayStore(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null) {
            packageName = getContext().getPackageName();
        }
        try {
            // Forzamos que abra directamente Google Play (sin selector de apps)
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + packageName));
            intent.setPackage(PLAY_STORE_PACKAGE);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException ex) {
            // Si Google Play no está instalado, abrimos la ficha en el navegador
            try {
                Intent fallback = new Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://play.google.com/store/apps/details?id=" + packageName)
                );
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        }
    }
}
