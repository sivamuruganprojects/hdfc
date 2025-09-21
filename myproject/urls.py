"""
URL configuration for myproject project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from login.views import *

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', login_view, name='login'), 
    path('verify_user/', verify_user, name='verify_user'), 
    path('verify_password/', verify_password, name='verify_password'), 
    path('dashboard/', dashboard_view, name='dashboard'),
    path('dashboard_updated/', dashboard_updated_view, name='dashboard_updated'),
    path('get-updated-report/', generate_updated_report, name='generate_updated_report'),
    

]
