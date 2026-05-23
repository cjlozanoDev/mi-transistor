package com.mitransistor.app;

import android.content.ComponentName;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.annotation.NonNull;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.session.MediaController;
import androidx.media3.session.SessionToken;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.common.util.concurrent.MoreExecutors;

@CapacitorPlugin(name = "AudioPlayer")
public class AudioPlayerPlugin extends Plugin {

    private MediaController controller;
    private ListenableFuture<MediaController> controllerFuture;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private final Player.Listener playerListener = new Player.Listener() {
        @Override
        public void onIsPlayingChanged(boolean isPlaying) {
            emitState();
        }

        @Override
        public void onPlaybackStateChanged(int playbackState) {
            emitState();
        }

        @Override
        public void onPlayerError(@NonNull PlaybackException error) {
            JSObject data = new JSObject();
            data.put("code", error.errorCode);
            data.put("message", error.getMessage() != null ? error.getMessage() : "");
            notifyListeners("error", data);
        }
    };

    @Override
    public void load() {
        super.load();
        mainHandler.post(this::initController);
    }

    private void initController() {
        if (controller != null) return;
        SessionToken token = new SessionToken(getContext(), new ComponentName(getContext(), PlaybackService.class));
        controllerFuture = new MediaController.Builder(getContext(), token).buildAsync();
        controllerFuture.addListener(() -> {
            try {
                controller = controllerFuture.get();
                controller.addListener(playerListener);
                emitState();
            } catch (Exception ignored) {
            }
        }, MoreExecutors.directExecutor());
    }

    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url required");
            return;
        }
        String title = call.getString("title", "");
        String artist = call.getString("artist", "Radio en directo");
        String artwork = call.getString("artwork", null);

        mainHandler.post(() -> {
            if (controller == null) {
                call.reject("controller not ready");
                return;
            }
            MediaMetadata.Builder metaBuilder = new MediaMetadata.Builder()
                .setTitle(title)
                .setArtist(artist)
                .setAlbumTitle("Mi Transistor")
                .setIsBrowsable(false)
                .setIsPlayable(true);
            if (artwork != null && !artwork.isEmpty()) {
                metaBuilder.setArtworkUri(Uri.parse(artwork));
            }
            MediaItem item = new MediaItem.Builder()
                .setMediaId(url)
                .setUri(url)
                .setMediaMetadata(metaBuilder.build())
                .build();
            controller.setMediaItem(item);
            controller.prepare();
            controller.setPlayWhenReady(true);
            call.resolve();
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        mainHandler.post(() -> {
            if (controller != null) {
                controller.stop();
                controller.clearMediaItems();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void updateMetadata(PluginCall call) {
        String title = call.getString("title", "");
        String artist = call.getString("artist", "Radio en directo");
        String artwork = call.getString("artwork", null);
        mainHandler.post(() -> {
            if (controller == null) {
                call.resolve();
                return;
            }
            MediaItem current = controller.getCurrentMediaItem();
            if (current == null) {
                call.resolve();
                return;
            }
            MediaMetadata.Builder metaBuilder = new MediaMetadata.Builder()
                .setTitle(title)
                .setArtist(artist)
                .setAlbumTitle("Mi Transistor")
                .setIsBrowsable(false)
                .setIsPlayable(true);
            if (artwork != null && !artwork.isEmpty()) {
                metaBuilder.setArtworkUri(Uri.parse(artwork));
            }
            MediaItem updated = current.buildUpon().setMediaMetadata(metaBuilder.build()).build();
            controller.replaceMediaItem(controller.getCurrentMediaItemIndex(), updated);
            call.resolve();
        });
    }

    @PluginMethod
    public void getState(PluginCall call) {
        mainHandler.post(() -> {
            call.resolve(buildState());
        });
    }

    private void emitState() {
        notifyListeners("state", buildState());
    }

    private JSObject buildState() {
        JSObject data = new JSObject();
        if (controller == null) {
            data.put("isPlaying", false);
            data.put("isBuffering", false);
            return data;
        }
        boolean isPlaying = controller.isPlaying();
        int state = controller.getPlaybackState();
        boolean isBuffering = state == Player.STATE_BUFFERING && controller.getPlayWhenReady();
        data.put("isPlaying", isPlaying || isBuffering);
        data.put("isBuffering", isBuffering);
        return data;
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (controller != null) {
            controller.removeListener(playerListener);
            controller.release();
            controller = null;
        }
        if (controllerFuture != null) {
            MediaController.releaseFuture(controllerFuture);
            controllerFuture = null;
        }
    }
}
