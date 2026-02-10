from django.contrib import admin
from django.urls import path

from django.conf import settings
from django.conf.urls.static import static

from gallery.views import home, about, upload

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home, name='home'),
    path('upload/', upload, name='upload')
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )