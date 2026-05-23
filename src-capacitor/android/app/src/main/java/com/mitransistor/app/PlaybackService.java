package com.mitransistor.app;

import android.app.PendingIntent;
import android.content.Intent;
import androidx.annotation.Nullable;
import androidx.annotation.OptIn;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.exoplayer.DefaultLoadControl;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.LoadControl;
import androidx.media3.exoplayer.upstream.DefaultLoadErrorHandlingPolicy;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

@OptIn(markerClass = UnstableApi.class)
public class PlaybackService extends MediaSessionService {

    private MediaSession mediaSession;
    private ExoPlayer player;

    @Override
    public void onCreate() {
        super.onCreate();

        DefaultHttpDataSource.Factory httpFactory = new DefaultHttpDataSource.Factory()
            .setUserAgent("MiTransistor/1.0 (Android)")
            .setConnectTimeoutMs(15000)
            .setReadTimeoutMs(15000)
            .setAllowCrossProtocolRedirects(true);

        DefaultMediaSourceFactory mediaSourceFactory = new DefaultMediaSourceFactory(this)
            .setDataSourceFactory(httpFactory)
            .setLoadErrorHandlingPolicy(new DefaultLoadErrorHandlingPolicy(Integer.MAX_VALUE));

        LoadControl loadControl = new DefaultLoadControl.Builder()
            .setBufferDurationsMs(15000, 50000, 1500, 2500)
            .build();

        player = new ExoPlayer.Builder(this)
            .setMediaSourceFactory(mediaSourceFactory)
            .setLoadControl(loadControl)
            .setAudioAttributes(
                new AudioAttributes.Builder()
                    .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                    .setUsage(C.USAGE_MEDIA)
                    .build(),
                true
            )
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_NETWORK)
            .build();

        PendingIntent sessionActivity = PendingIntent.getActivity(
            this,
            0,
            new Intent(this, MainActivity.class),
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        mediaSession = new MediaSession.Builder(this, player)
            .setSessionActivity(sessionActivity)
            .build();
    }

    @Nullable
    @Override
    public MediaSession onGetSession(@Nullable MediaSession.ControllerInfo controllerInfo) {
        return mediaSession;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        if (player != null && !player.getPlayWhenReady()) {
            stopSelf();
        }
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.release();
            mediaSession = null;
        }
        if (player != null) {
            player.release();
            player = null;
        }
        super.onDestroy();
    }
}
