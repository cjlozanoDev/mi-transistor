package com.mitransistor.app;

import android.os.Bundle;
import com.capgo.mediasession.MediaSessionPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(WakeLockPlugin.class);
        registerPlugin(MediaSessionPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onBackPressed() {
        if (bridge != null && bridge.getWebView() != null && bridge.getWebView().canGoBack()) {
            bridge.getWebView().goBack();
        } else {
            moveTaskToBack(true);
        }
    }
}
