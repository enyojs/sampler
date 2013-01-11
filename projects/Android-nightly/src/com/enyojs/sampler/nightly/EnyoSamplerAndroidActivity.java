package com.enyojs.sampler.nightly;

import android.os.Bundle;
import org.apache.cordova.*;

public class EnyoSamplerAndroidActivity extends DroidGap {
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.loadUrl("http://nightly.enyojs.com/latest/sampler/index.html?extras=true&debug=true");
    }
}