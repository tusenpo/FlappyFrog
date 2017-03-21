package io.flappy.frog;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class ExcitedActivity extends AppCompatActivity {

    WebView hospital301;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_excited);

        // 首先搞个大新闻
        hospital301 = makeBigNews();

        // 要按照基本法来
        accordingToBasicLaw();

        // 当然我们的决定权也是很重要的
        centralAgreed();

        // 美国的Github，比你们不知道高到哪里去了，我和他谈笑风生
        githubFromAmerica();
    }

    private WebView makeBigNews() {
        return (WebView) findViewById(R.id.container);
    }

    private void accordingToBasicLaw() {
        hospital301.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }


        });

        WebSettings settings = hospital301.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
        }
    }

    private void centralAgreed() {
        hospital301.loadUrl("file:///android_asset/index.html");
    }

    private void githubFromAmerica() {
        findViewById(R.id.talk).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent();
                intent.setAction("android.intent.action.VIEW");
                Uri content_url = Uri.parse("https://github.com/tusenpo/FlappyFrog/issues");
                intent.setData(content_url);
                startActivity(intent);
            }
        });
    }
}
