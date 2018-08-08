import docker
import os
import shutil
import uuid

from docker.errors import APIError
from docker.errors import ContainerError
from docker.errors import ImageNotFound

CURRENT_DIR = os.path.dirname(os.path.relpath(__file__))
IMAGE_NAME = 'zhangsquared/judger_updated'

client = docker.from_env()

# store the code in tmp folder
TEMP_BUILD_DIR = "%s/tmp/" % CURRENT_DIR
# latest is the latest ersion of docker image
CONTAINER_NAME = "%s:latest" % IMAGE_NAME

SOURCE_FILE_NAMES = {
    "java": "Example.java",
    "python": "example.py",
    "c++": "example.cpp"
}

BINARY_NAMES = {
    "java": "Example",
    "python": "example.py",
    "c++": "example"
}

BUILD_COMMANDS = {
    "java": "javac",
    "python": "python3",
    "c++": "g++"
}

EXECUTE_COMMANDS = {
    "java": "java",
    "python": "python3",
    "c++": "./"
}

def load_image():
    try:
        client.images.get(IMAGE_NAME)
        print("image exists locally")
    except ImageNotFound:
        # if we don't have local copy of the image, loading from docker hub
        print("Image not found locally, loading from docker hub")
        client.image.pull(IMAGE_NAME)
    except APIError:
        print("Cannot connect to docker")
    
    return

def make_dir(dir):
    try:
        os.mkdir(dir)
    except OSError:
        print("Cannot create directory")

def build_and_run(code, lang):
    result = { 'build': None, 'run': None, 'error': None }
    source_file_parent_dir_name = uuid.uuid4() # use uuid to create unique file name
    source_file_host_dir = "%s/%s" % (TEMP_BUILD_DIR, source_file_parent_dir_name) # linux or mac, physic machine
    source_file_guest_dir = "/test/%s" % (source_file_parent_dir_name) # docker env
    make_dir(source_file_host_dir)

    with open("%s/%s" % (source_file_host_dir, SOURCE_FILE_NAMES[lang]), 'w') as source_file: # open with write
        source_file.write(code)
    
    # script to build the code
    if lang == "java" or lang == "python":
        buildCmd = "%s %s" %(BUILD_COMMANDS[lang], SOURCE_FILE_NAMES[lang])
    else:
        # g++ -o hello hello.cpp
        buildCmd = "%s -o %s %s" % (BUILD_COMMANDS[lang], BINARY_NAMES[lang], SOURCE_FILE_NAMES[lang])
    print(buildCmd)

    try:
        client.containers.run(
            image = IMAGE_NAME,
            command = buildCmd,
            # bind the host dir and guest dir
            # we have read and write permission of guest dir
            # docker can access the host dir
            volumes = {source_file_host_dir: {'bind': source_file_guest_dir, 'mode': 'rw'}}, # read and write
            working_dir = source_file_guest_dir
        )
        print ("source built")
        result['build'] = 'OK'
    except ContainerError as e:
        result['build'] = str(e.stderr, 'utf-8') # get error msg form container
        shutil.rmtree(source_file_host_dir) # remove host dir
        return result
    
    # script to run the code
    if lang == "java" or lang == "python":
        runCmd = "%s %s" %(EXECUTE_COMMANDS[lang], BINARY_NAMES[lang])
    else:
        # ./hello
        runCmd = "%s%s" %(EXECUTE_COMMANDS[lang], BINARY_NAMES[lang])    
    print(runCmd)

    try:
        log = client.containers.run(
            image = IMAGE_NAME,
            command = runCmd, # execute the code
            volumes = {source_file_host_dir: {'bind': source_file_guest_dir, 'mode': 'rw'}}, # read and write
            working_dir = source_file_guest_dir
        )
        log = str(log, 'utf-8')
        print(log)
        result['run'] = log
    except ContainerError as e:
        result['run'] = str(e.stderr, 'utf-8')
        shutil.rmtree(source_file_host_dir)
        return result

    shutil.rmtree(source_file_host_dir) #after build and run clean up dir
    return result
