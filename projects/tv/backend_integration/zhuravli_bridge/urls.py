from django.urls import path

from . import views

app_name = "zhuravli_bridge"

urlpatterns = [
    path("home/", views.portal_home, name="home"),
    path("agent/jobs/", views.create_agent_job, name="agent-job-create"),
    path("agent/jobs/<uuid:job_id>/", views.agent_job, name="agent-job-detail"),
]
