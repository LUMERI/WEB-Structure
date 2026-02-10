from django.shortcuts import render, redirect
from django.contrib import messages

from .models import Asset
from .forms import AssetForm


def home(request):
    assets = Asset.objects.all().order_by('-created_at')

    context_data = {
        'page_title': 'Главная Галерея',
        'assets': assets,
    }
    return render(request, 'gallery/index.html', context_data)

def about(request):
    context = {
        'page_title': 'Данил',
        'about_text': 'МЮ Лучший',
    }
    return render(request, 'gallery/about.html', context)

def upload(request):
    if request.method == 'POST':
        form = AssetForm(request.POST, request.FILES)

        if form.is_valid():
            form.save()
            messages.success(request, 'Модель успешно загружена 🎉')

            return redirect('home')
    else:
        form = AssetForm()

    return render(request, 'gallery/upload.html', {'form': form})
